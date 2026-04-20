import { useState, useEffect } from 'react';
import { Activity, Database, Zap, Clock, TrendingUp } from 'lucide-react';

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState(null);
  const [cacheStats, setCacheStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      // 获取性能指标
      const metricsResponse = await fetch('http://localhost:5001/api/metrics');
      const metricsData = await metricsResponse.json();
      if (metricsData.success) {
        setMetrics(metricsData.metrics);
      }

      // 获取缓存统计
      const cacheResponse = await fetch('http://localhost:5001/api/cache/stats');
      const cacheData = await cacheResponse.json();
      if (cacheData.success) {
        setCacheStats(cacheData.stats);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const clearCache = async () => {
    try {
      await fetch('http://localhost:5001/api/cache/clear', { method: 'POST' });
      loadMetrics();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const formatTime = (seconds) => {
    if (seconds < 1) return `${(seconds * 1000).toFixed(0)}ms`;
    return `${seconds.toFixed(2)}s`;
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-800">性能监控</h2>
        <button
          onClick={clearCache}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          清空缓存
        </button>
      </div>

      {/* 总体统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">总请求数</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {metrics?.total_requests || 0}
              </p>
            </div>
            <Activity className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">失败请求</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {metrics?.failed_requests || 0}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">平均响应时间</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatTime(metrics?.avg_response_time || 0)}
              </p>
            </div>
            <Clock className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">缓存条目</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {cacheStats?.total_entries || 0}
              </p>
            </div>
            <Database className="w-12 h-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* 端点详情 */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">API 端点统计</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-gray-700 font-semibold">端点</th>
                <th className="text-right py-3 px-4 text-gray-700 font-semibold">请求数</th>
                <th className="text-right py-3 px-4 text-gray-700 font-semibold">平均时间</th>
                <th className="text-right py-3 px-4 text-gray-700 font-semibold">失败数</th>
                <th className="text-right py-3 px-4 text-gray-700 font-semibold">错误率</th>
              </tr>
            </thead>
            <tbody>
              {metrics?.endpoints && Object.entries(metrics.endpoints).map(([endpoint, data]) => (
                <tr key={endpoint} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-800 font-mono text-sm">{endpoint}</td>
                  <td className="py-3 px-4 text-right text-gray-800">{data.count}</td>
                  <td className="py-3 px-4 text-right text-gray-800">
                    {formatTime(data.avg_time || 0)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-800">{data.failures}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      data.error_rate > 0.1 ? 'bg-red-100 text-red-800' :
                      data.error_rate > 0.05 ? 'bg-amber-100 text-amber-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {((data.error_rate || 0) * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 缓存详情 */}
      {cacheStats && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">缓存详情</h3>
          <div className="space-y-2">
            {cacheStats.keys?.map((key) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-mono text-gray-700">{key}</span>
                <span className="text-sm text-gray-600">
                  {formatBytes(cacheStats.sizes?.[key] || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
