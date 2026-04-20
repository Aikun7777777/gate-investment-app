#!/usr/bin/env python3
"""
投资分析引擎
基于多维度分析给出投资建议
"""

import requests
from datetime import datetime

class InvestmentAnalyzer:
    def __init__(self, trader):
        self.trader = trader

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

    def _suggest_position(self, total_score, risk_level):
        """建议仓位 - 更保守的策略"""
        if total_score >= 65 and risk_level == "低风险":
            return "15-25%"
        elif total_score >= 65:
            return "10-20%"
        elif total_score >= 55:
            return "8-15%"
        elif total_score >= 45:
            return "3-8%"
        else:
            return "观望"

    def analyze_product(self, pair):
        """分析单个投资品"""
        try:
            # 获取价格数据
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

            # 1. 趋势分析 (0-30分)
            trend_score = self._analyze_trend(change_24h, last_price, high_24h, low_24h)

            # 2. 成交量分析 (0-20分)
            volume_score = self._analyze_volume(volume_24h, pair)

            # 3. 波动率分析 (0-20分)
            volatility_score = self._analyze_volatility(high_24h, low_24h, last_price)

            # 4. 资金费率分析 (0-30分) - 仅合约
            funding_score = 0
            funding_rate = None
            annual_rate = None
            if '_Quarter' in pair or '_Perpetual' in pair:
                funding_score, funding_rate, annual_rate = self._analyze_funding_rate(pair)

            # 总分
            total_score = trend_score + volume_score + volatility_score + funding_score

            # 投资建议
            recommendation = self._generate_recommendation(
                total_score, trend_score, volume_score, volatility_score, funding_score
            )

            # 风险等级
            risk_level = self._calculate_risk_level(volatility_score, volume_score)

            return {
                'symbol': pair,
                'current_price': last_price,
                'change_24h': change_24h,
                'volume_24h': volume_24h,
                'technical_score': trend_score,
                'fundamental_score': volume_score,
                'sentiment_score': volatility_score,
                'funding_score': funding_score,
                'overall_score': int(total_score),
                'recommendation': recommendation,
                'risk_level': risk_level,
                'suggested_position': self._suggest_position(total_score, risk_level),
                'funding_rate': funding_rate,
                'annual_rate': annual_rate,
                'reasons': self._generate_reasons(
                    trend_score, volume_score, volatility_score, funding_score, change_24h
                ),
                'strategy': self._generate_strategy(total_score, trend_score, risk_level),
                'risk_warning': self._generate_risk_warning(risk_level, volatility_score, volume_score)
            }

        except Exception as e:
            print(f"分析 {pair} 失败: {e}")
            return None

    def _analyze_trend(self, change_24h, last_price, high_24h, low_24h):
        """趋势分析 - 更严格的评分标准"""
        score = 0

        # 涨跌幅评分 (0-15分) - 只有明显上涨才给高分
        if change_24h > 10:
            score += 15  # 强势上涨
        elif change_24h > 5:
            score += 12
        elif change_24h > 3:
            score += 8
        elif change_24h > 1:
            score += 5
        elif change_24h > -1:
            score += 2  # 横盘
        elif change_24h > -3:
            score += 0
        else:
            score -= 5  # 大幅下跌扣分

        # 价格位置评分 (0-15分) - 更倾向于低位和中位
        if high_24h > 0 and low_24h > 0:
            price_position = (last_price - low_24h) / (high_24h - low_24h) if high_24h != low_24h else 0.5
            if price_position > 0.85:
                score += 5  # 接近高点，追高风险大
            elif price_position > 0.7:
                score += 8
            elif price_position > 0.5:
                score += 12  # 中位，较好
            elif price_position > 0.3:
                score += 15  # 中低位，最佳
            elif price_position > 0.15:
                score += 12  # 低位，可能反弹
            else:
                score += 8  # 极低位，可能继续下跌

        return max(0, min(score, 30))

    def _analyze_volume(self, volume_24h, pair):
        """成交量分析"""
        # 根据不同品种设定不同的成交量标准
        if 'BTC' in pair:
            thresholds = [1000, 500, 100, 50]
        elif 'ETH' in pair:
            thresholds = [5000, 2000, 500, 100]
        else:
            thresholds = [10000, 5000, 1000, 500]

        if volume_24h > thresholds[0]:
            return 20  # 成交活跃
        elif volume_24h > thresholds[1]:
            return 15
        elif volume_24h > thresholds[2]:
            return 10
        elif volume_24h > thresholds[3]:
            return 5
        else:
            return 2  # 成交清淡

    def _analyze_volatility(self, high_24h, low_24h, last_price):
        """波动率分析 - 更严格的标准"""
        if high_24h == 0 or low_24h == 0 or last_price == 0:
            return 5

        volatility = (high_24h - low_24h) / last_price * 100

        if volatility > 20:
            return 0  # 波动过大，风险极高
        elif volatility > 15:
            return 3  # 波动很大，风险高
        elif volatility > 10:
            return 8
        elif volatility > 5:
            return 15  # 适中波动，机会较好
        elif volatility > 2:
            return 20  # 稳定但有波动，最佳
        else:
            return 8  # 波动太小，机会少

    def _analyze_funding_rate(self, pair):
        """资金费率分析（仅合约）"""
        try:
            # 这里简化处理，实际应该调用资金费率API
            # 暂时返回默认值
            return 15, 0.0001, 10.95
        except:
            return 0, None, None

    def _generate_recommendation(self, total_score, trend_score, volume_score, volatility_score, funding_score):
        """生成投资建议 - 更严格的标准"""
        if total_score >= 65:
            return "强烈推荐"
        elif total_score >= 55:
            return "推荐"
        elif total_score >= 45:
            return "可以考虑"
        elif total_score >= 35:
            return "谨慎观望"
        else:
            return "不推荐"

    def _calculate_risk_level(self, volatility_score, volume_score):
        """计算风险等级"""
        risk_score = (20 - volatility_score) + (20 - volume_score)

        if risk_score > 25:
            return "高风险"
        elif risk_score > 15:
            return "中风险"
        else:
            return "低风险"

    def _generate_reasons(self, trend_score, volume_score, volatility_score, funding_score, change_24h):
        """生成详细的推荐理由"""
        reasons = []

        # 趋势分析
        if trend_score >= 20:
            if change_24h > 10:
                reasons.append(f"📈 强势上涨 {change_24h:.2f}%，动能充足")
            elif change_24h > 5:
                reasons.append(f"📈 稳健上涨 {change_24h:.2f}%，趋势向好")
            elif change_24h > 1:
                reasons.append(f"📊 温和上涨 {change_24h:.2f}%，价格位置良好")
            else:
                reasons.append("📊 价格处于理想区间，适合布局")
        elif trend_score >= 10:
            if change_24h > 0:
                reasons.append(f"📊 小幅上涨 {change_24h:.2f}%，观察后续走势")
            else:
                reasons.append(f"📉 小幅下跌 {change_24h:.2f}%，可能是调整机会")
        else:
            if change_24h < -5:
                reasons.append(f"⚠️ 大幅下跌 {change_24h:.2f}%，建议观望")
            else:
                reasons.append(f"📉 趋势偏弱 {change_24h:.2f}%，等待企稳信号")

        # 成交量分析
        if volume_score >= 15:
            reasons.append("💰 成交量活跃，市场关注度高，流动性充足")
        elif volume_score >= 10:
            reasons.append("💰 成交量适中，有一定市场参与度")
        elif volume_score < 8:
            reasons.append("⚠️ 成交清淡，流动性不足，需谨慎")

        # 波动率分析
        if volatility_score >= 18:
            reasons.append("✅ 波动率适中，风险可控，适合稳健投资")
        elif volatility_score >= 12:
            reasons.append("📊 波动适中，有交易机会但需控制仓位")
        elif volatility_score < 10:
            reasons.append("⚠️ 波动较大，风险较高，建议降低仓位或观望")

        # 资金费率分析
        if funding_score >= 20:
            reasons.append("💸 资金费率存在套利机会")

        return reasons

    def _generate_strategy(self, total_score, trend_score, risk_level):
        """生成操作策略"""
        if total_score >= 65:
            return "建议分批建仓，可在回调时加仓，设置止损位保护利润"
        elif total_score >= 55:
            return "可适量建仓，建议分2-3批进场，严格止损"
        elif total_score >= 45:
            return "小仓位试探，观察市场反应后决定是否加仓"
        elif total_score >= 35:
            return "暂时观望，等待更明确的信号再入场"
        else:
            return "不建议入场，风险大于机会"

    def _generate_risk_warning(self, risk_level, volatility_score, volume_score):
        """生成风险提示"""
        warnings = []

        if risk_level == "高风险":
            warnings.append("⚠️ 高风险品种，可能出现大幅波动")

        if volatility_score < 10:
            warnings.append("⚠️ 波动剧烈，建议降低杠杆或减小仓位")

        if volume_score < 8:
            warnings.append("⚠️ 流动性不足，可能存在滑点风险")

        if not warnings:
            warnings.append("✅ 风险相对可控，但仍需设置止损")

        return " | ".join(warnings)
