"""
错误处理和日志系统
提供统一的错误处理、日志记录和监控功能
"""
import logging
import traceback
from functools import wraps
from flask import jsonify
from datetime import datetime
import os

# 配置日志
log_dir = os.path.expanduser("~/.openclaw/logs")
os.makedirs(log_dir, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(log_dir, 'gate_api.log')),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger('gate_api')

class APIError(Exception):
    """自定义API错误"""
    def __init__(self, message, status_code=500, payload=None):
        super().__init__()
        self.message = message
        self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['success'] = False
        rv['error'] = self.message
        rv['timestamp'] = datetime.now().isoformat()
        return rv

def handle_errors(f):
    """错误处理装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except APIError as e:
            logger.error(f"API Error in {f.__name__}: {e.message}")
            return jsonify(e.to_dict()), e.status_code
        except Exception as e:
            logger.error(f"Unexpected error in {f.__name__}: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({
                'success': False,
                'error': 'Internal server error',
                'details': str(e) if os.getenv('DEBUG') else None,
                'timestamp': datetime.now().isoformat()
            }), 500
    return decorated_function

def log_request(f):
    """请求日志装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from flask import request
        logger.info(f"Request: {request.method} {request.path} from {request.remote_addr}")
        start_time = datetime.now()

        result = f(*args, **kwargs)

        duration = (datetime.now() - start_time).total_seconds()
        logger.info(f"Response: {request.path} completed in {duration:.3f}s")

        return result
    return decorated_function

class PerformanceMonitor:
    """性能监控"""
    def __init__(self):
        self.metrics = {
            'total_requests': 0,
            'failed_requests': 0,
            'avg_response_time': 0,
            'endpoints': {}
        }

    def record_request(self, endpoint, duration, success=True):
        """记录请求指标"""
        self.metrics['total_requests'] += 1
        if not success:
            self.metrics['failed_requests'] += 1

        if endpoint not in self.metrics['endpoints']:
            self.metrics['endpoints'][endpoint] = {
                'count': 0,
                'total_time': 0,
                'failures': 0
            }

        ep_metrics = self.metrics['endpoints'][endpoint]
        ep_metrics['count'] += 1
        ep_metrics['total_time'] += duration
        if not success:
            ep_metrics['failures'] += 1

        # 更新平均响应时间
        total_time = sum(ep['total_time'] for ep in self.metrics['endpoints'].values())
        self.metrics['avg_response_time'] = total_time / self.metrics['total_requests']

    def get_metrics(self):
        """获取性能指标"""
        metrics = self.metrics.copy()
        for endpoint, data in metrics['endpoints'].items():
            if data['count'] > 0:
                data['avg_time'] = data['total_time'] / data['count']
                data['error_rate'] = data['failures'] / data['count']
        return metrics

# 全局性能监控实例
performance_monitor = PerformanceMonitor()
