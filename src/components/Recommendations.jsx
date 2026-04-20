import { useState, useEffect } from 'react';
import { formatPrice, formatPercent } from '../utils/formatter';

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const result = await window.electron.invoke('gate:getRecommendations');
      if (result.success) {
        setRecommendations(result.recommendations);
        setLastUpdate(new Date(result.timestamp));
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
    const interval = setInterval(fetchRecommendations, 60000); // 每分钟更新
    return () => clearInterval(interval);
  }, []);

  const getScoreColor = (score) => {
    if (score >= 65) return 'text-emerald-600';
    if (score >= 55) return 'text-blue-600';
    if (score >= 45) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 65) return 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300';
    if (score >= 55) return 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300';
    if (score >= 45) return 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300';
    return 'bg-gradient-to-br from-red-50 to-red-100 border-red-300';
  };

  const getRecommendationBadge = (rec) => {
    const score = rec.overall_score;
    if (score >= 65) return { text: '强烈推荐', icon: '🔥', color: 'bg-emerald-500' };
    if (score >= 55) return { text: '推荐', icon: '👍', color: 'bg-blue-500' };
    if (score >= 45) return { text: '可以考虑', icon: '🤔', color: 'bg-amber-500' };
    if (score >= 35) return { text: '谨慎观望', icon: '⚠️', color: 'bg-orange-500' };
    return { text: '不推荐', icon: '❌', color: 'bg-red-500' };
  };

  const getRiskBadgeColor = (risk) => {
    if (risk === '低风险') return 'bg-green-100 text-green-800 border-green-300';
    if (risk === '中风险') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  if (loading && recommendations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载投资建议中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">投资建议</h2>
          <p className="text-sm text-gray-500 mt-1">基于多维度分析的智能投资推荐</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">最后更新</div>
          <div className="text-sm font-medium text-gray-600">
            {lastUpdate ? lastUpdate.toLocaleTimeString() : '--:--:--'}
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {recommendations.map((rec) => {
          const badge = getRecommendationBadge(rec);
          return (
            <div key={rec.symbol} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
              {/* 头部 */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 text-white">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold">{rec.symbol.replace('_', '/')}</h3>
                      <span className={`${badge.color} text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
                        <span>{badge.icon}</span>
                        <span>{badge.text}</span>
                      </span>
                    </div>
                    <div className="text-3xl font-mono font-bold mt-2">
                      {formatPrice(rec.current_price)}
                    </div>
                    <div className={`text-sm mt-1 ${rec.change_24h >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {rec.change_24h >= 0 ? '↗' : '↘'} {formatPercent(rec.change_24h)}
                    </div>
                  </div>
                  <div className={`px-6 py-4 rounded-xl border-2 ${getScoreBg(rec.overall_score)}`}>
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${getScoreColor(rec.overall_score)}`}>
                        {rec.overall_score}
                      </div>
                      <div className="text-xs text-gray-600 mt-1 font-medium">综合评分</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 评分详情 */}
              <div className="grid grid-cols-5 gap-4 p-6 bg-gray-50 border-b">
                <div className="text-center">
                  <div className="text-xs text-gray-500 mb-1">趋势</div>
                  <div className={`text-2xl font-bold ${getScoreColor(rec.trend_score)}`}>
                    {rec.trend_score}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">/ 25</div>
                </div>
                <div className="text-center border-l border-gray-300">
                  <div className="text-xs text-gray-500 mb-1">技术指标</div>
                  <div className={`text-2xl font-bold ${getScoreColor(rec.technical_score)}`}>
                    {rec.technical_score}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">/ 25</div>
                </div>
                <div className="text-center border-l border-gray-300">
                  <div className="text-xs text-gray-500 mb-1">成交量</div>
                  <div className={`text-2xl font-bold ${getScoreColor(rec.volume_score)}`}>
                    {rec.volume_score}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">/ 20</div>
                </div>
                <div className="text-center border-l border-gray-300">
                  <div className="text-xs text-gray-500 mb-1">波动率</div>
                  <div className={`text-2xl font-bold ${getScoreColor(rec.volatility_score)}`}>
                    {rec.volatility_score}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">/ 15</div>
                </div>
                <div className="text-center border-l border-gray-300">
                  <div className="text-xs text-gray-500 mb-1">市场情绪</div>
                  <div className={`text-2xl font-bold ${getScoreColor(rec.sentiment_score)}`}>
                    {rec.sentiment_score}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">/ 15</div>
                </div>
              </div>

              {/* 分析要点 */}
              <div className="p-6 border-b">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">📊</span>
                  <h4 className="text-sm font-bold text-gray-700">分析要点</h4>
                </div>
                <ul className="space-y-2">
                  {rec.reasons.map((reason, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start bg-gray-50 p-3 rounded-lg">
                      <span className="mr-2 text-blue-500">▪</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 操作策略 */}
              {rec.strategy && (
                <div className="p-6 bg-blue-50 border-b border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">💡</span>
                    <h4 className="text-sm font-bold text-blue-900">操作策略</h4>
                  </div>
                  <p className="text-sm text-blue-800 leading-relaxed">{rec.strategy}</p>
                </div>
              )}

              {/* 风险提示 */}
              {rec.risk_warning && (
                <div className="p-6 bg-amber-50 border-b border-amber-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">⚠️</span>
                    <h4 className="text-sm font-bold text-amber-900">风险提示</h4>
                  </div>
                  <p className="text-sm text-amber-800 leading-relaxed">{rec.risk_warning}</p>
                </div>
              )}

              {/* 价格目标 */}
              {rec.price_targets && (
                <div className="p-6 bg-purple-50 border-b border-purple-100">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🎯</span>
                    <h4 className="text-sm font-bold text-purple-900">价格目标</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded-lg border border-green-200">
                      <div className="text-xs text-gray-500 mb-1">目标位 1</div>
                      <div className="text-lg font-bold text-green-600">
                        {formatPrice(rec.price_targets.target1)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        +{(((rec.price_targets.target1 - rec.current_price) / rec.current_price) * 100).toFixed(2)}%
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-green-300">
                      <div className="text-xs text-gray-500 mb-1">目标位 2</div>
                      <div className="text-lg font-bold text-green-700">
                        {formatPrice(rec.price_targets.target2)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        +{(((rec.price_targets.target2 - rec.current_price) / rec.current_price) * 100).toFixed(2)}%
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-red-200">
                      <div className="text-xs text-gray-500 mb-1">止损位</div>
                      <div className="text-lg font-bold text-red-600">
                        {formatPrice(rec.price_targets.stop_loss)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {(((rec.price_targets.stop_loss - rec.current_price) / rec.current_price) * 100).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 底部信息 */}
              <div className="p-6 bg-gray-50 flex justify-between items-center">
                <div className="flex gap-4">
                  <div>
                    <div className="text-xs text-gray-500">风险等级</div>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold border ${getRiskBadgeColor(rec.risk_level)}`}>
                      {rec.risk_level}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">建议仓位</div>
                    <div className="text-sm font-bold text-gray-800 mt-1">{rec.suggested_position}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">24h成交量</div>
                  <div className="text-sm font-medium text-gray-700 mt-1">
                    {rec.volume_24h.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {recommendations.length === 0 && !loading && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📊</div>
          <div className="text-gray-500 text-lg">暂无投资建议</div>
          <div className="text-gray-400 text-sm mt-2">系统正在分析市场数据...</div>
        </div>
      )}
    </div>
  );
}
