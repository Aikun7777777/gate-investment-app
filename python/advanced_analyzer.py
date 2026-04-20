#!/usr/bin/env python3
"""
高级投资分析引擎
集成多种技术指标和深度市场分析
"""

import requests
from datetime import datetime, timedelta
import statistics

class AdvancedInvestmentAnalyzer:
    def __init__(self, trader):
        self.trader = trader
        self.cache = {}  # 数据缓存
        self.cache_ttl = 60  # 缓存60秒

    def analyze_all_products(self, pairs):
        """分析所有投资品并给出评分"""
        results = []

        for pair in pairs:
            analysis = self.analyze_product(pair)
            if analysis:
                results.append(analysis)

        # 按总分排序
        results.sort(key=lambda x: x['overall_score'], reverse=True)
        return results

    def analyze_product(self, pair):
        """深度分析单个投资品"""
        try:
            # 获取实时数据
            ticker_data = self.trader.get_ticker(pair)
            if not ticker_data or 'error' in ticker_data or len(ticker_data) == 0:
                return None

            ticker = ticker_data[0]

            # 基础数据
            last_price = float(ticker.get('last', 0))
            change_24h = float(ticker.get('change_percentage', 0))
            volume_24h = float(ticker.get('base_volume', 0))
            high_24h = float(ticker.get('high_24h', 0))
            low_24h = float(ticker.get('low_24h', 0))

            if last_price == 0:
                return None

            # 获取K线数据用于技术指标计算
            candlesticks = self._get_candlesticks(pair)

            # 1. 趋势分析 (0-25分) - 包含多周期趋势
            trend_score = self._analyze_trend_advanced(
                change_24h, last_price, high_24h, low_24h, candlesticks
            )

            # 2. 技术指标分析 (0-25分) - RSI, MACD, 布林带
            technical_score = self._analyze_technical_indicators(candlesticks, last_price)

            # 3. 成交量分析 (0-20分) - 包含量价关系
            volume_score = self._analyze_volume_advanced(volume_24h, pair, candlesticks)

            # 4. 波动率与风险分析 (0-15分)
            volatility_score = self._analyze_volatility_advanced(high_24h, low_24h, last_price, candlesticks)

            # 5. 市场情绪分析 (0-15分) - 买卖压力、订单簿深度
            sentiment_score = self._analyze_market_sentiment(pair, last_price)

            # 总分
            total_score = trend_score + technical_score + volume_score + volatility_score + sentiment_score

            # 风险等级
            risk_level = self._calculate_risk_level_advanced(
                volatility_score, volume_score, sentiment_score
            )

            # 投资建议
            recommendation = self._generate_recommendation_advanced(
                total_score, trend_score, technical_score, risk_level
            )

            # 生成详细分析
            detailed_analysis = self._generate_detailed_analysis(
                trend_score, technical_score, volume_score,
                volatility_score, sentiment_score, change_24h, candlesticks
            )

            return {
                'symbol': pair,
                'current_price': last_price,
                'change_24h': change_24h,
                'volume_24h': volume_24h,
                'high_24h': high_24h,
                'low_24h': low_24h,
                'trend_score': trend_score,
                'technical_score': technical_score,
                'volume_score': volume_score,
                'volatility_score': volatility_score,
                'sentiment_score': sentiment_score,
                'overall_score': int(total_score),
                'recommendation': recommendation,
                'risk_level': risk_level,
                'suggested_position': self._suggest_position(total_score, risk_level),
                'reasons': detailed_analysis['reasons'],
                'strategy': detailed_analysis['strategy'],
                'risk_warning': detailed_analysis['risk_warning'],
                'technical_indicators': detailed_analysis['indicators'],
                'price_targets': self._calculate_price_targets(last_price, high_24h, low_24h, trend_score)
            }

        except Exception as e:
            print(f"分析 {pair} 失败: {e}")
            return None

    def _get_candlesticks(self, pair, limit=100):
        """获取K线数据"""
        try:
            # 检查缓存
            cache_key = f"candles_{pair}"
            if cache_key in self.cache:
                cached_time, cached_data = self.cache[cache_key]
                if (datetime.now() - cached_time).seconds < self.cache_ttl:
                    return cached_data

            # 获取1小时K线，最近100根
            candles = self.trader.get_candlesticks(pair, interval='1h', limit=limit)

            if candles and not isinstance(candles, dict):
                # 缓存数据
                self.cache[cache_key] = (datetime.now(), candles)
                return candles

            return []
        except:
            return []

    def _analyze_trend_advanced(self, change_24h, last_price, high_24h, low_24h, candlesticks):
        """高级趋势分析 - 多周期趋势判断"""
        score = 0

        # 1. 短期趋势 (24h涨跌幅) - 0-10分
        if change_24h > 15:
            score += 10
        elif change_24h > 8:
            score += 8
        elif change_24h > 3:
            score += 6
        elif change_24h > 0:
            score += 4
        elif change_24h > -3:
            score += 2
        elif change_24h > -8:
            score += 0
        else:
            score -= 3

        # 2. 价格位置 (相对24h高低点) - 0-8分
        if high_24h > 0 and low_24h > 0:
            price_position = (last_price - low_24h) / (high_24h - low_24h) if high_24h != low_24h else 0.5
            if 0.3 <= price_position <= 0.6:
                score += 8  # 中位最佳
            elif 0.2 <= price_position < 0.3 or 0.6 < price_position <= 0.7:
                score += 6
            elif price_position < 0.2:
                score += 5  # 低位
            else:
                score += 3  # 高位追高风险

        # 3. 中期趋势 (基于K线数据) - 0-7分
        if candlesticks and len(candlesticks) >= 20:
            try:
                closes = [float(c[2]) for c in candlesticks[-20:]]  # 最近20根K线收盘价

                # 计算移动平均线
                ma5 = sum(closes[-5:]) / 5
                ma10 = sum(closes[-10:]) / 10
                ma20 = sum(closes[-20:]) / 20

                # 均线多头排列
                if ma5 > ma10 > ma20:
                    score += 7
                elif ma5 > ma10:
                    score += 5
                elif ma5 > ma20:
                    score += 3
                else:
                    score += 1
            except:
                score += 3

        return max(0, min(score, 25))

    def _analyze_technical_indicators(self, candlesticks, current_price):
        """技术指标分析 - RSI, MACD等"""
        score = 0

        if not candlesticks or len(candlesticks) < 30:
            return 12  # 默认中等分数

        try:
            closes = [float(c[2]) for c in candlesticks[-30:]]

            # 1. RSI指标 (0-10分)
            rsi = self._calculate_rsi(closes, period=14)
            if 40 <= rsi <= 60:
                score += 10  # 中性区域，最佳
            elif 30 <= rsi < 40 or 60 < rsi <= 70:
                score += 8  # 接近超卖/超买
            elif 20 <= rsi < 30:
                score += 6  # 超卖，可能反弹
            elif rsi > 70:
                score += 4  # 超买，风险
            else:
                score += 5

            # 2. MACD指标 (0-8分)
            macd_signal = self._calculate_macd_signal(closes)
            if macd_signal == 'bullish':
                score += 8
            elif macd_signal == 'neutral':
                score += 5
            else:
                score += 2

            # 3. 布林带位置 (0-7分)
            bb_position = self._calculate_bollinger_position(closes, current_price)
            if 0.3 <= bb_position <= 0.7:
                score += 7  # 中轨附近
            elif bb_position < 0.3:
                score += 5  # 下轨附近，可能反弹
            else:
                score += 3  # 上轨附近，可能回调

        except Exception as e:
            print(f"技术指标计算失败: {e}")
            score = 12

        return max(0, min(score, 25))

    def _calculate_rsi(self, prices, period=14):
        """计算RSI指标"""
        if len(prices) < period + 1:
            return 50

        deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
        gains = [d if d > 0 else 0 for d in deltas]
        losses = [-d if d < 0 else 0 for d in deltas]

        avg_gain = sum(gains[-period:]) / period
        avg_loss = sum(losses[-period:]) / period

        if avg_loss == 0:
            return 100

        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        return rsi

    def _calculate_macd_signal(self, prices):
        """计算MACD信号"""
        if len(prices) < 26:
            return 'neutral'

        # 简化的MACD计算
        ema12 = self._calculate_ema(prices, 12)
        ema26 = self._calculate_ema(prices, 26)
        macd = ema12 - ema26

        # 判断信号
        if macd > 0:
            return 'bullish'
        elif macd < 0:
            return 'bearish'
        else:
            return 'neutral'

    def _calculate_ema(self, prices, period):
        """计算指数移动平均"""
        if len(prices) < period:
            return sum(prices) / len(prices)

        multiplier = 2 / (period + 1)
        ema = sum(prices[:period]) / period

        for price in prices[period:]:
            ema = (price - ema) * multiplier + ema

        return ema

    def _calculate_bollinger_position(self, prices, current_price):
        """计算价格在布林带中的位置"""
        if len(prices) < 20:
            return 0.5

        ma20 = sum(prices[-20:]) / 20
        std = statistics.stdev(prices[-20:])

        upper_band = ma20 + (2 * std)
        lower_band = ma20 - (2 * std)

        if upper_band == lower_band:
            return 0.5

        position = (current_price - lower_band) / (upper_band - lower_band)
        return max(0, min(1, position))

    def _analyze_volume_advanced(self, volume_24h, pair, candlesticks):
        """高级成交量分析"""
        score = 0

        # 1. 绝对成交量评分 (0-12分)
        if 'BTC' in pair:
            thresholds = [2000, 1000, 500, 200]
        elif 'ETH' in pair:
            thresholds = [10000, 5000, 2000, 1000]
        else:
            thresholds = [20000, 10000, 5000, 2000]

        if volume_24h > thresholds[0]:
            score += 12
        elif volume_24h > thresholds[1]:
            score += 10
        elif volume_24h > thresholds[2]:
            score += 7
        elif volume_24h > thresholds[3]:
            score += 4
        else:
            score += 1

        # 2. 量价关系 (0-8分)
        if candlesticks and len(candlesticks) >= 10:
            try:
                recent_volumes = [float(c[5]) for c in candlesticks[-10:]]
                avg_volume = sum(recent_volumes) / len(recent_volumes)

                # 成交量是否放大
                if volume_24h > avg_volume * 1.5:
                    score += 8  # 放量
                elif volume_24h > avg_volume * 1.2:
                    score += 6
                elif volume_24h > avg_volume * 0.8:
                    score += 4
                else:
                    score += 2  # 缩量
            except:
                score += 4

        return max(0, min(score, 20))

    def _analyze_volatility_advanced(self, high_24h, low_24h, last_price, candlesticks):
        """高级波动率分析"""
        if high_24h == 0 or low_24h == 0 or last_price == 0:
            return 7

        # 1. 24h波动率 (0-10分)
        volatility = (high_24h - low_24h) / last_price * 100

        if volatility > 25:
            score = 0
        elif volatility > 20:
            score = 2
        elif volatility > 15:
            score = 4
        elif volatility > 10:
            score = 6
        elif volatility > 5:
            score = 8
        elif volatility > 2:
            score = 10
        else:
            score = 6

        # 2. 历史波动率对比 (0-5分)
        if candlesticks and len(candlesticks) >= 20:
            try:
                historical_volatilities = []
                for i in range(len(candlesticks) - 1):
                    h = float(candlesticks[i][3])
                    l = float(candlesticks[i][4])
                    c = float(candlesticks[i][2])
                    if c > 0:
                        historical_volatilities.append((h - l) / c * 100)

                if historical_volatilities:
                    avg_volatility = sum(historical_volatilities) / len(historical_volatilities)

                    # 当前波动率相对历史
                    if volatility < avg_volatility * 0.8:
                        score += 5  # 波动收敛
                    elif volatility < avg_volatility * 1.2:
                        score += 3
                    else:
                        score += 1  # 波动放大
            except:
                score += 3

        return max(0, min(score, 15))

    def _analyze_market_sentiment(self, pair, current_price):
        """市场情绪分析"""
        score = 8  # 默认分数

        try:
            # 获取订单簿深度
            orderbook = self.trader.get_orderbook(pair)

            if orderbook and 'bids' in orderbook and 'asks' in orderbook:
                bids = orderbook['bids'][:10]  # 前10档买单
                asks = orderbook['asks'][:10]  # 前10档卖单

                if bids and asks:
                    # 计算买卖压力
                    bid_volume = sum([float(b[1]) for b in bids])
                    ask_volume = sum([float(a[1]) for a in asks])

                    total_volume = bid_volume + ask_volume
                    if total_volume > 0:
                        bid_ratio = bid_volume / total_volume

                        # 买卖比例评分
                        if 0.55 <= bid_ratio <= 0.65:
                            score = 15  # 买盘强势
                        elif 0.45 <= bid_ratio < 0.55:
                            score = 12  # 均衡
                        elif 0.35 <= bid_ratio < 0.45:
                            score = 8   # 卖盘稍强
                        else:
                            score = 5   # 卖盘压力大
        except:
            pass

        return max(0, min(score, 15))

    def _calculate_risk_level_advanced(self, volatility_score, volume_score, sentiment_score):
        """高级风险等级计算"""
        risk_score = (15 - volatility_score) * 2 + (20 - volume_score) + (15 - sentiment_score)

        if risk_score > 35:
            return "高风险"
        elif risk_score > 20:
            return "中风险"
        else:
            return "低风险"

    def _generate_recommendation_advanced(self, total_score, trend_score, technical_score, risk_level):
        """生成投资建议"""
        # 综合考虑总分、趋势和技术指标
        if total_score >= 70 and trend_score >= 18 and technical_score >= 18:
            return "强烈推荐"
        elif total_score >= 60 and (trend_score >= 15 or technical_score >= 15):
            return "推荐"
        elif total_score >= 50:
            return "可以考虑"
        elif total_score >= 40:
            return "谨慎观望"
        else:
            return "不推荐"

    def _suggest_position(self, total_score, risk_level):
        """建议仓位"""
        if total_score >= 70 and risk_level == "低风险":
            return "20-30%"
        elif total_score >= 70:
            return "15-25%"
        elif total_score >= 60 and risk_level == "低风险":
            return "15-20%"
        elif total_score >= 60:
            return "10-15%"
        elif total_score >= 50:
            return "5-10%"
        elif total_score >= 40:
            return "3-5%"
        else:
            return "观望"

    def _generate_detailed_analysis(self, trend_score, technical_score, volume_score,
                                   volatility_score, sentiment_score, change_24h, candlesticks):
        """生成详细分析报告"""
        reasons = []

        # 趋势分析
        if trend_score >= 18:
            if change_24h > 10:
                reasons.append(f"🚀 强势上涨趋势 (+{change_24h:.2f}%)，多头动能充足")
            elif change_24h > 5:
                reasons.append(f"📈 稳健上涨 (+{change_24h:.2f}%)，趋势向好")
            else:
                reasons.append("📊 价格位置理想，均线呈多头排列")
        elif trend_score >= 12:
            reasons.append(f"📊 趋势中性 ({change_24h:+.2f}%)，等待方向选择")
        else:
            if change_24h < -5:
                reasons.append(f"⚠️ 下跌趋势 ({change_24h:.2f}%)，建议观望")
            else:
                reasons.append(f"📉 趋势偏弱 ({change_24h:.2f}%)，缺乏上涨动力")

        # 技术指标
        if technical_score >= 18:
            reasons.append("✅ 技术指标良好，RSI/MACD显示买入信号")
        elif technical_score >= 12:
            reasons.append("📊 技术指标中性，可继续观察")
        else:
            reasons.append("⚠️ 技术指标偏弱，存在超买风险")

        # 成交量
        if volume_score >= 15:
            reasons.append("💰 成交量活跃，市场参与度高，流动性充足")
        elif volume_score >= 10:
            reasons.append("💰 成交量适中，有一定市场关注")
        else:
            reasons.append("⚠️ 成交清淡，流动性不足，需谨慎")

        # 波动率
        if volatility_score >= 12:
            reasons.append("✅ 波动率适中，风险可控，适合稳健投资")
        elif volatility_score >= 8:
            reasons.append("📊 波动适中，有交易机会但需控制仓位")
        else:
            reasons.append("⚠️ 波动剧烈，风险较高，建议降低仓位")

        # 市场情绪
        if sentiment_score >= 12:
            reasons.append("😊 市场情绪积极，买盘强势")
        elif sentiment_score >= 8:
            reasons.append("😐 市场情绪中性，多空均衡")
        else:
            reasons.append("😟 市场情绪偏弱，卖压较大")

        # 生成策略
        total = trend_score + technical_score + volume_score + volatility_score + sentiment_score

        if total >= 70:
            strategy = "建议分批建仓，可在回调时加仓。设置止损位在关键支撑下方2-3%，目标位看向近期高点"
        elif total >= 60:
            strategy = "可适量建仓，建议分2-3批进场，每次回调1-2%时加仓。严格止损，盈亏比至少1:2"
        elif total >= 50:
            strategy = "小仓位试探，观察市场反应。如果价格企稳并放量上涨，可考虑加仓"
        elif total >= 40:
            strategy = "暂时观望，等待更明确的买入信号。关注关键支撑位和成交量变化"
        else:
            strategy = "不建议入场，风险大于机会。等待趋势反转信号"

        # 风险提示
        warnings = []
        if volatility_score < 8:
            warnings.append("波动剧烈")
        if volume_score < 8:
            warnings.append("流动性不足")
        if sentiment_score < 8:
            warnings.append("市场情绪偏弱")

        if warnings:
            risk_warning = f"⚠️ {', '.join(warnings)}，建议降低仓位或观望"
        else:
            risk_warning = "✅ 风险相对可控，但仍需设置止损保护本金"

        # 技术指标详情
        indicators = {
            'trend': f"{trend_score}/25",
            'technical': f"{technical_score}/25",
            'volume': f"{volume_score}/20",
            'volatility': f"{volatility_score}/15",
            'sentiment': f"{sentiment_score}/15"
        }

        return {
            'reasons': reasons,
            'strategy': strategy,
            'risk_warning': risk_warning,
            'indicators': indicators
        }

    def _calculate_price_targets(self, current_price, high_24h, low_24h, trend_score):
        """计算价格目标位"""
        range_24h = high_24h - low_24h

        if trend_score >= 18:
            # 上涨趋势
            target1 = current_price * 1.03
            target2 = current_price * 1.05
            stop_loss = current_price * 0.97
        elif trend_score >= 12:
            # 中性
            target1 = current_price * 1.02
            target2 = current_price * 1.04
            stop_loss = current_price * 0.98
        else:
            # 下跌趋势
            target1 = current_price * 1.01
            target2 = current_price * 1.02
            stop_loss = current_price * 0.95

        return {
            'target1': round(target1, 2),
            'target2': round(target2, 2),
            'stop_loss': round(stop_loss, 2)
        }
