#!/usr/bin/env python3
"""
价格监控服务
定期检查价格预警并触发通知
"""

import time
import threading
from datetime import datetime
from gate_trader import GateTrader
from price_alert import PriceAlertSystem

class PriceMonitor:
    def __init__(self, trader, alert_system, check_interval=30):
        """
        初始化价格监控器
        check_interval: 检查间隔（秒）
        """
        self.trader = trader
        self.alert_system = alert_system
        self.check_interval = check_interval
        self.running = False
        self.thread = None
        self.callbacks = []

    def add_callback(self, callback):
        """添加预警触发回调函数"""
        self.callbacks.append(callback)

    def start(self):
        """启动监控"""
        if self.running:
            return

        self.running = True
        self.thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.thread.start()
        print(f"✅ 价格监控已启动，检查间隔: {self.check_interval}秒")

    def stop(self):
        """停止监控"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)
        print("⏹️  价格监控已停止")

    def _monitor_loop(self):
        """监控循环"""
        while self.running:
            try:
                self._check_all_alerts()
            except Exception as e:
                print(f"❌ 监控错误: {e}")

            time.sleep(self.check_interval)

    def _check_all_alerts(self):
        """检查所有活跃预警"""
        active_alerts = self.alert_system.get_active_alerts()

        if not active_alerts:
            return

        # 按交易对分组
        pairs_to_check = {}
        for alert in active_alerts:
            pair = alert['pair']
            if pair not in pairs_to_check:
                pairs_to_check[pair] = []
            pairs_to_check[pair].append(alert)

        # 检查每个交易对
        for pair, alerts in pairs_to_check.items():
            try:
                # 获取当前价格
                result = self.trader.get_ticker(pair)
                if not result or 'error' in result or len(result) == 0:
                    continue

                current_price = float(result[0].get('last', 0))
                if current_price <= 0:
                    continue

                # 检查预警
                triggered = self.alert_system.check_alerts(pair, current_price)

                # 触发回调
                if triggered:
                    for alert in triggered:
                        print(f"🔔 预警触发: {pair} {alert['condition']} ${alert['target_price']}, 当前价格: ${current_price}")
                        for callback in self.callbacks:
                            try:
                                callback(alert, current_price)
                            except Exception as e:
                                print(f"回调执行失败: {e}")

            except Exception as e:
                print(f"检查 {pair} 失败: {e}")

    def get_status(self):
        """获取监控状态"""
        active_alerts = self.alert_system.get_active_alerts()
        return {
            'running': self.running,
            'check_interval': self.check_interval,
            'active_alerts_count': len(active_alerts),
            'last_check': datetime.now().isoformat()
        }
