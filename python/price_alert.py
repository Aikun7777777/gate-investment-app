#!/usr/bin/env python3
"""
价格预警和通知系统
"""

import json
import os
from datetime import datetime

class PriceAlertSystem:
    def __init__(self, config_file=None):
        self.config_file = config_file or os.path.expanduser("~/.openclaw/price-alerts.json")
        self.alerts = self.load_alerts()

    def load_alerts(self):
        """加载价格预警配置"""
        try:
            if os.path.exists(self.config_file):
                with open(self.config_file, 'r') as f:
                    return json.load(f)
            return {}
        except:
            return {}

    def save_alerts(self):
        """保存价格预警配置"""
        try:
            os.makedirs(os.path.dirname(self.config_file), exist_ok=True)
            with open(self.config_file, 'w') as f:
                json.dump(self.alerts, f, indent=2)
        except Exception as e:
            print(f"保存预警配置失败: {e}")

    def add_alert(self, pair, price, condition='above', message=''):
        """
        添加价格预警
        condition: 'above' (高于), 'below' (低于)
        """
        alert_id = f"{pair}_{condition}_{price}_{datetime.now().timestamp()}"

        self.alerts[alert_id] = {
            'pair': pair,
            'target_price': price,
            'condition': condition,
            'message': message,
            'created_at': datetime.now().isoformat(),
            'triggered': False
        }

        self.save_alerts()
        return alert_id

    def remove_alert(self, alert_id):
        """删除价格预警"""
        if alert_id in self.alerts:
            del self.alerts[alert_id]
            self.save_alerts()
            return True
        return False

    def check_alerts(self, pair, current_price):
        """检查价格预警"""
        triggered_alerts = []

        for alert_id, alert in list(self.alerts.items()):
            if alert['pair'] != pair or alert['triggered']:
                continue

            target_price = alert['target_price']
            condition = alert['condition']

            # 检查是否触发
            triggered = False
            if condition == 'above' and current_price >= target_price:
                triggered = True
            elif condition == 'below' and current_price <= target_price:
                triggered = True

            if triggered:
                alert['triggered'] = True
                alert['triggered_at'] = datetime.now().isoformat()
                alert['triggered_price'] = current_price
                triggered_alerts.append(alert)

        if triggered_alerts:
            self.save_alerts()

        return triggered_alerts

    def get_active_alerts(self, pair=None):
        """获取活跃的预警"""
        active = []
        for alert_id, alert in self.alerts.items():
            if not alert['triggered']:
                if pair is None or alert['pair'] == pair:
                    active.append({**alert, 'id': alert_id})
        return active

    def get_triggered_alerts(self, pair=None, limit=10):
        """获取已触发的预警"""
        triggered = []
        for alert_id, alert in self.alerts.items():
            if alert['triggered']:
                if pair is None or alert['pair'] == pair:
                    triggered.append({**alert, 'id': alert_id})

        # 按触发时间排序
        triggered.sort(key=lambda x: x.get('triggered_at', ''), reverse=True)
        return triggered[:limit]
