"""
数据缓存管理器
提供内存缓存功能，减少API调用次数，提升性能
"""
import time
from threading import Lock
from typing import Any, Optional, Dict
import json

class CacheManager:
    def __init__(self):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.lock = Lock()

    def get(self, key: str, max_age: int = 60) -> Optional[Any]:
        """
        获取缓存数据

        Args:
            key: 缓存键
            max_age: 最大缓存时间（秒），默认60秒

        Returns:
            缓存的数据，如果过期或不存在则返回None
        """
        with self.lock:
            if key not in self.cache:
                return None

            cache_entry = self.cache[key]
            age = time.time() - cache_entry['timestamp']

            if age > max_age:
                del self.cache[key]
                return None

            return cache_entry['data']

    def set(self, key: str, data: Any) -> None:
        """
        设置缓存数据

        Args:
            key: 缓存键
            data: 要缓存的数据
        """
        with self.lock:
            self.cache[key] = {
                'data': data,
                'timestamp': time.time()
            }

    def delete(self, key: str) -> None:
        """删除缓存"""
        with self.lock:
            if key in self.cache:
                del self.cache[key]

    def clear(self) -> None:
        """清空所有缓存"""
        with self.lock:
            self.cache.clear()

    def get_stats(self) -> Dict[str, Any]:
        """获取缓存统计信息"""
        with self.lock:
            return {
                'total_entries': len(self.cache),
                'keys': list(self.cache.keys()),
                'sizes': {k: len(json.dumps(v['data'])) for k, v in self.cache.items()}
            }

# 全局缓存实例
cache = CacheManager()
