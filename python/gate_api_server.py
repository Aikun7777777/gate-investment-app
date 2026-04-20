#!/usr/bin/env python3
"""
Gate.io API Flask Server
提供 REST API 接口供 Electron 应用调用
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
import sys
from datetime import datetime

sys.path.append(os.path.dirname(__file__))
from gate_trader import GateTrader, format_price
from advanced_analyzer import AdvancedInvestmentAnalyzer
from price_alert import PriceAlertSystem
from price_monitor import PriceMonitor
from cache_manager import cache
from error_handler import handle_errors, log_request, performance_monitor, logger

app = Flask(__name__)
CORS(app)

CONFIG_FILE = os.path.expanduser("~/.openclaw/gate-config.json")

def load_config():
    try:
        with open(CONFIG_FILE, 'r') as f:
            return json.load(f)
    except:
        return {
            "gate": {
                "testnet": True,
                "testnet_api_key": "",
                "testnet_api_secret": ""
            }
        }

config = load_config()
gate_config = config.get('gate', {})

# 对于市场数据，使用主网（不需要认证）
# 对于交易操作，使用配置的 testnet 设置
use_testnet = gate_config.get('testnet', True)
trader = GateTrader(
    api_key=gate_config.get('api_key' if not use_testnet else 'testnet_api_key', ''),
    api_secret=gate_config.get('api_secret' if not use_testnet else 'testnet_api_secret', ''),
    testnet=False  # 使用主网获取市场数据
)
analyzer = AdvancedInvestmentAnalyzer(trader)
alert_system = PriceAlertSystem()

# 启动价格监控（每30秒检查一次）
price_monitor = PriceMonitor(trader, alert_system, check_interval=30)
price_monitor.start()

# 请求前后钩子 - 性能监控
@app.before_request
def before_request():
    from flask import g
    g.start_time = datetime.now()

@app.after_request
def after_request(response):
    from flask import g, request
    if hasattr(g, 'start_time'):
        duration = (datetime.now() - g.start_time).total_seconds()
        success = response.status_code < 400
        performance_monitor.record_request(request.path, duration, success)
    return response

@app.route('/api/price/<pair>', methods=['GET'])
@handle_errors
@log_request
def get_price(pair):
    # 尝试从缓存获取（5秒缓存）
    cache_key = f'price:{pair}'
    cached_data = cache.get(cache_key, max_age=5)
    if cached_data:
        return jsonify(cached_data)

    result = trader.get_ticker(pair)
    if result and 'error' not in result and len(result) > 0:
        ticker = result[0]
        response_data = {
            'success': True,
            'pair': pair,
            'last': float(ticker.get('last', 0)),
            'highest_bid': float(ticker.get('highest_bid', 0)),
            'lowest_ask': float(ticker.get('lowest_ask', 0)),
            'change_24h': ticker.get('change_24h', '0'),
            'high_24h': float(ticker.get('highest_24h', 0)),
            'low_24h': float(ticker.get('lowest_24h', 0)),
            'volume_24h': float(ticker.get('base_volume', 0))
        }
        cache.set(cache_key, response_data)
        return jsonify(response_data)
    return jsonify({'success': False, 'error': 'Failed to fetch price'})

@app.route('/api/account', methods=['GET'])
@handle_errors
@log_request
def get_account():
    result = trader.get_spot_account()
    if result and 'error' not in result:
        balances = []
        for acc in result:
            available = float(acc.get('available', 0))
            locked = float(acc.get('locked', 0))
            if available > 0 or locked > 0:
                balances.append({
                    'currency': acc.get('currency'),
                    'available': available,
                    'locked': locked
                })
        return jsonify({'success': True, 'balances': balances})
    return jsonify({'success': False, 'error': 'Failed to fetch account'})

@app.route('/api/order', methods=['POST'])
@handle_errors
@log_request
def place_order():
    data = request.json
    pair = data.get('pair')
    side = data.get('side')
    order_type = data.get('type', 'limit')
    amount = data.get('amount')
    price = data.get('price')

    result = trader.place_order(pair, side, order_type, amount, price)
    if result and 'error' not in result:
        return jsonify({'success': True, 'order': result})
    return jsonify({'success': False, 'error': result.get('error', 'Failed to place order')})

@app.route('/api/orderbook/<pair>', methods=['GET'])
@handle_errors
@log_request
def get_orderbook(pair):
    limit = request.args.get('limit', 10, type=int)

    # 尝试从缓存获取（3秒缓存）
    cache_key = f'orderbook:{pair}:{limit}'
    cached_data = cache.get(cache_key, max_age=3)
    if cached_data:
        return jsonify(cached_data)

    result = trader.get_order_book(pair, limit)
    if result and 'error' not in result:
        response_data = {
            'success': True,
            'bids': [[float(b[0]), float(b[1])] for b in result.get('bids', [])],
            'asks': [[float(a[0]), float(a[1])] for a in result.get('asks', [])]
        }
        cache.set(cache_key, response_data)
        return jsonify(response_data)
    return jsonify({'success': False, 'error': 'Failed to fetch orderbook'})

@app.route('/api/funding-rates', methods=['GET'])
def get_funding_rates():
    import requests

    testnet = gate_config.get('testnet', True)
    host = "https://api-testnet.gateapi.io" if testnet else "https://api.gateio.ws"
    url = f"{host}/api/v4/futures/usdt/contracts"

    try:
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            data = r.json()
            rates = []

            majors = ["BTC", "ETH", "SOL", "XRP", "DOGE", "ADA", "AVAX", "LINK", "DOT", "MATIC"]

            for item in data:
                name = item.get("name", "")
                if "_USDT" not in name:
                    continue

                base = name.replace("_USDT", "")
                if base not in majors:
                    continue

                funding_rate = float(item.get("funding_rate") or 0)
                funding_interval = int(item.get("funding_interval", 28800))

                periods_per_day = 86400 / funding_interval if funding_interval > 0 else 3
                annual_rate = funding_rate * periods_per_day * 365 * 100

                rates.append({
                    "coin": base,
                    "name": name,
                    "funding_rate": funding_rate,
                    "annual_rate": annual_rate,
                    "last_price": float(item.get("last_price") or 0)
                })

            return jsonify({'success': True, 'rates': rates})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

    return jsonify({'success': False, 'error': 'Failed to fetch funding rates'})

@app.route('/api/config', methods=['GET'])
def get_config():
    return jsonify({
        'success': True,
        'config': config
    })

@app.route('/api/recommendations', methods=['GET'])
@handle_errors
@log_request
def get_recommendations():
    """获取投资推荐"""
    try:
        # 尝试从缓存获取（60秒缓存）
        cache_key = 'recommendations'
        cached_data = cache.get(cache_key, max_age=60)
        if cached_data:
            return jsonify(cached_data)

        # 获取监控列表
        watched_pairs = config.get('trading', {}).get('watched_pairs', [
            'BTC_USDT', 'ETH_USDT', 'SOL_USDT'
        ])

        # 分析所有投资品
        results = analyzer.analyze_all_products(watched_pairs)

        response_data = {
            'success': True,
            'recommendations': results,
            'timestamp': datetime.now().isoformat()
        }
        cache.set(cache_key, response_data)
        return jsonify(response_data)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """获取价格预警列表"""
    pair = request.args.get('pair')
    active = alert_system.get_active_alerts(pair)
    triggered = alert_system.get_triggered_alerts(pair)
    return jsonify({
        'success': True,
        'active': active,
        'triggered': triggered
    })

@app.route('/api/alerts', methods=['POST'])
def add_alert():
    """添加价格预警"""
    data = request.json
    pair = data.get('pair')
    price = float(data.get('price'))
    condition = data.get('condition', 'above')
    message = data.get('message', '')

    alert_id = alert_system.add_alert(pair, price, condition, message)
    return jsonify({
        'success': True,
        'alert_id': alert_id
    })

@app.route('/api/alerts/<alert_id>', methods=['DELETE'])
def delete_alert(alert_id):
    """删除价格预警"""
    success = alert_system.remove_alert(alert_id)
    return jsonify({'success': success})

@app.route('/api/price/<pair>/check-alerts', methods=['GET'])
def check_price_alerts(pair):
    """检查价格预警并返回触发的预警"""
    result = trader.get_ticker(pair)
    if result and 'error' not in result and len(result) > 0:
        current_price = float(result[0].get('last', 0))
        triggered = alert_system.check_alerts(pair, current_price)
        return jsonify({
            'success': True,
            'current_price': current_price,
            'triggered_alerts': triggered
        })
    return jsonify({'success': False, 'error': 'Failed to fetch price'})

@app.route('/api/monitor/status', methods=['GET'])
def get_monitor_status():
    """获取价格监控状态"""
    status = price_monitor.get_status()
    return jsonify({
        'success': True,
        'status': status
    })

@app.route('/api/cache/stats', methods=['GET'])
def get_cache_stats():
    """获取缓存统计信息"""
    stats = cache.get_stats()
    return jsonify({
        'success': True,
        'stats': stats
    })

@app.route('/api/cache/clear', methods=['POST'])
def clear_cache():
    """清空缓存"""
    cache.clear()
    return jsonify({
        'success': True,
        'message': 'Cache cleared'
    })

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    """获取性能指标"""
    metrics = performance_monitor.get_metrics()
    return jsonify({
        'success': True,
        'metrics': metrics
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    print("🚀 Gate.io API Server starting on http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=False)
