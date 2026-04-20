/**
 * 前端缓存工具
 * 提供内存缓存和 localStorage 持久化缓存
 */

class CacheManager {
  constructor() {
    this.memoryCache = new Map();
  }

  /**
   * 获取缓存数据
   * @param {string} key - 缓存键
   * @param {number} maxAge - 最大缓存时间（毫秒）
   * @returns {any|null} 缓存的数据或 null
   */
  get(key, maxAge = 60000) {
    const cached = this.memoryCache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > maxAge) {
      this.memoryCache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * 设置缓存数据
   * @param {string} key - 缓存键
   * @param {any} data - 要缓存的数据
   */
  set(key, data) {
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   */
  delete(key) {
    this.memoryCache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear() {
    this.memoryCache.clear();
  }

  /**
   * 获取缓存统计
   */
  getStats() {
    return {
      size: this.memoryCache.size,
      keys: Array.from(this.memoryCache.keys())
    };
  }
}

// 全局缓存实例
export const cache = new CacheManager();

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit = 1000) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 带缓存的 fetch 包装器
 * @param {string} url - 请求 URL
 * @param {object} options - fetch 选项
 * @param {number} cacheTime - 缓存时间（毫秒）
 * @returns {Promise} fetch 结果
 */
export async function cachedFetch(url, options = {}, cacheTime = 60000) {
  const cacheKey = `fetch:${url}:${JSON.stringify(options)}`;

  // 尝试从缓存获取
  const cached = cache.get(cacheKey, cacheTime);
  if (cached) {
    return cached;
  }

  // 发起请求
  const response = await fetch(url, options);
  const data = await response.json();

  // 缓存结果
  if (response.ok) {
    cache.set(cacheKey, data);
  }

  return data;
}
