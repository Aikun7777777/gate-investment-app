#!/usr/bin/env python3
"""
Gate.io Trading Agent
kk's comprehensive trading bot for Gate.io
Supports: Spot, Perpetual, ETFs, Gold, US Stocks, Indices
"""

import sys
import json
import time
import requests
from datetime import datetime

# Configuration
CONFIG_FILE = "~/.openclaw/gate-config.json"

class GateTrader:
    def __init__(self, api_key, api_secret, testnet=True):
        self.testnet = testnet
        if testnet:
            self.base_url = "https://api-testnet.gateapi.ws"
        else:
            self.base_url = "https://api.gateio.ws"
        self.api_key = api_key
        self.api_secret = api_secret
        
    def _sign(self, query_string):
        import hmac
        import hashlib
        return hmac.new(
            self.api_secret.encode('utf-8'),
            query_string.encode('utf-8'),
            hashlib.sha512
        ).hexdigest()
    
    def _request(self, method, path, params=None, signed=False):
        url = f"{self.base_url}{path}"
        headers = {}
        if signed:
            headers['KEY'] = self.api_key
            headers['SIGN'] = self._sign(f"GET\n{path}\n\n")
        
        try:
            if method == 'GET':
                resp = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                resp = requests.post(url, headers=headers, json=params, timeout=10)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            return {"error": str(e)}
    
    # Spot Trading
    def get_spot_account(self):
        return self._request('GET', '/api/v4/spot/accounts', signed=True)
    
    def get_ticker(self, pair):
        return self._request('GET', f'/api/v4/spot/tickers', params={'currency_pair': pair})
    
    def get_price(self, pair):
        result = self.get_ticker(pair)
        if result and 'error' not in result and len(result) > 0:
            return float(result[0].get('last', 0))
        return None
    
    def place_order(self, pair, side, order_type, amount, price=None):
        """Place a spot order"""
        params = {
            'currency_pair': pair,
            'type': order_type,
            'side': side,
            'amount': str(amount)
        }
        if price:
            params['price'] = str(price)
        return self._request('POST', '/api/v4/spot/orders', params=params, signed=True)
    
    # Futures Trading
    def get_futures_balance(self):
        return self._request('GET', '/api/v4/futures/usdt/accounts', signed=True)
    
    def get_perpetual_contracts(self):
        return self._request('GET', '/api/v4/futures/usdt/contracts')
    
    def get_perpetual_ticker(self, contract):
        return self._request('GET', f'/api/v4/futures/usdt/tickers', params={'contract': contract})
    
    # Order Book
    def get_order_book(self, pair, limit=10):
        return self._request('GET', f'/api/v4/spot/order_book', params={'currency_pair': pair, 'limit': limit})

    def get_orderbook(self, pair, limit=10):
        """Alias for get_order_book"""
        return self.get_order_book(pair, limit)

    # Candlesticks (K-line data)
    def get_candlesticks(self, pair, interval='1h', limit=100):
        """
        Get candlestick data
        interval: 10s, 1m, 5m, 15m, 30m, 1h, 4h, 8h, 1d, 7d, 30d
        """
        params = {
            'currency_pair': pair,
            'interval': interval,
            'limit': limit
        }
        return self._request('GET', '/api/v4/spot/candlesticks', params=params)

    # Available Pairs
    def get_available_pairs(self):
        return self._request('GET', '/api/v4/spot/currency_pairs')


def format_price(price, decimals=4):
    """Format price with appropriate decimals"""
    if price is None:
        return "N/A"
    if price >= 1000:
        return f"${price:,.2f}"
    elif price >= 1:
        return f"${price:,.4f}"
    else:
        return f"${price:,.6f}"


def main():
    import argparse
    parser = argparse.ArgumentParser(description='Gate.io Trading Agent')
    parser.add_argument('action', choices=['price', 'orderbook', 'account', 'balance', 'pairs', 'contracts'])
    parser.add_argument('--pair', default='BTC_USDT')
    parser.add_argument('--api-key', default='')
    parser.add_argument('--api-secret', default='')
    parser.add_argument('--testnet', action='store_true', default=True)
    args = parser.parse_args()
    
    # Init trader (testnet by default)
    trader = GateTrader(args.api_key, args.api_secret, testnet=args.testnet)
    
    if args.action == 'price':
        pair = args.pair
        result = trader.get_ticker(pair)
        if result and 'error' not in result and len(result) > 0:
            t = result[0]
            print(f"\n{'='*50}")
            print(f"📊 {pair} 当前行情")
            print(f"{'='*50}")
            print(f"最新价: {format_price(float(t.get('last', 0)))}")
            print(f"买一价: {format_price(float(t.get('highest_bid', 0)))}")
            print(f"卖一价: {format_price(float(t.get('lowest_ask', 0)))}")
            print(f"24h涨跌: {t.get('change_24h', 'N/A')}")
            print(f"24h高:  {format_price(float(t.get('highest_24h', 0)))}")
            print(f"24h低:  {format_price(float(t.get('lowest_24h', 0)))}")
            print(f"24h量:  {float(t.get('base_volume', 0)):,.2f}")
        else:
            print(f"获取价格失败: {result}")
    
    elif args.action == 'orderbook':
        result = trader.get_order_book(args.pair)
        if 'error' not in result:
            print(f"\n📋 {args.pair} 订单簿 (前5档)")
            print("-" * 40)
            print("买卖    | 价格          | 数量")
            print("-" * 40)
            for bid in result.get('bids', [])[:5]:
                print(f"买入   | {format_price(float(bid[0]))} | {float(bid[1]):.4f}")
            print("-" * 40)
            for ask in result.get('asks', [])[:5]:
                print(f"卖出   | {format_price(float(ask[0]))} | {float(ask[1]):.4f}")
        else:
            print(f"获取订单簿失败: {result}")
    
    elif args.action == 'account':
        result = trader.get_spot_account()
        if 'error' not in result:
            print(f"\n💰 现货账户")
            print("-" * 40)
            for acc in result:
                if float(acc.get('available', 0)) > 0:
                    print(f"{acc.get('currency'):8s} 可用: {acc.get('available')}  锁定: {acc.get('locked')}")
        else:
            print(f"获取账户失败: {result}")
    
    elif args.action == 'balance':
        result = trader.get_futures_balance()
        if 'error' not in result:
            print(f"\n📊 合约账户 USDT")
            print(f"可用: {result.get('available')}")
            print(f"锁定: {result.get('locked')}")
        else:
            print(f"获取合约余额失败: {result}")
    
    elif args.action == 'pairs':
        result = trader.get_available_pairs()
        if 'error' not in result:
            pairs = [p.get('id') for p in result if p.get('trade_status') == 'tradable']
            print(f"\n共 {len(pairs)} 个可交易现货对")
            print("\n主流交易对 (前50):")
            majors = ['BTC_USDT', 'ETH_USDT', 'BNB_USDT', 'SOL_USDT', 'XRP_USDT', 
                     'ADA_USDT', 'DOGE_USDT', 'AVAX_USDT', 'DOT_USDT', 'LINK_USDT',
                     'MATIC_USDT', 'UNI_USDT', 'ATOM_USDT', 'LTC_USDT', 'BCH_USDT',
                     'NEAR_USDT', 'APT_USDT', 'ARB_USDT', 'OP_USDT', 'FIL_USDT']
            for p in majors:
                if p in pairs:
                    print(f"  ✅ {p}")
            print(f"\n还有 {len(pairs) - len(majors)} 个其他交易对")
        else:
            print(f"获取交易对失败: {result}")
    
    elif args.action == 'contracts':
        result = trader.get_perpetual_contracts()
        if 'error' not in result:
            contracts = [c.get('name') or c.get('underlying') for c in result]
            print(f"\n共 {len(contracts)} 个USDT永续合约")
            print("前30个:")
            for c in contracts[:30]:
                print(f"  ✅ {c}")
        else:
            print(f"获取合约失败: {result}")


if __name__ == '__main__':
    main()
