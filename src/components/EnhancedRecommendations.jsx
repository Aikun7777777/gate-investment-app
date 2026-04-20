import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, Shield, Zap, BarChart3, RefreshCw } from 'lucide-react';
import { formatPrice, formatPercent } from '../utils/formatter';

export default function EnhancedRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedRec, setSelectedRec] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecommendations = async () => {
    setRefreshing(true);
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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
    const interval = setInterval(fetchRecommendations, 60000);
    return () => clearInterval(interval);
  }, []);

  const getScoreColor = (score) => {
    if (score >= 65) return 'from-emerald-500 to-green-600';
    if (score >= 55) return 'from-blue-500 to-indigo-600';
    if (score >= 45) return 'from-amber-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  const getRecommendationBadge = (score) => {
    if (score >= 65) return { text: '强烈推荐', icon: '🔥', color: 'bg-emerald-500' };
    if (score >= 55) return { text: '推荐', icon: '👍', color: 'bg-blue-500' };
    if (score >= 45) return { text: '可以考虑', icon: '🤔', color: 'bg-amber-500' };
    if (score >= 35) return { text: '谨慎观望', icon: '⚠️', color: 'bg-orange-500' };
    return { text: '不推荐', icon: '❌', color: 'bg-red-500' };
  };

  const getRiskBadge = (risk) => {
    const riskMap = {
      '低风险': { color: 'bg-green-100 text-green-800', icon: '🛡️' },
      '中低风险': { color: 'bg-blue-100 text-blue-800', icon: '📊' },
      '中等风险': { color: 'bg-amber-100 text-amber-800', icon: '⚡' },
      '中高风险': { color: 'bg-orange-100 text-orange-800', icon: '⚠️' },
      '高风险': { color: 'bg-red-100 text-red-800', icon: '🔥' }
    };
    return riskMap[risk] || riskMap['中等风险'];
  };

  const ScoreBar = ({ label, score, icon: Icon }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-600" />
          <span className="text-gray-700">{label}</span>
        </div>
        <span className="font-semibold text-gray-800">{score}/20</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
          style={{ width: `${(score / 20) * 100}%` }}
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">正在分析市场数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">投资建议</h2>
          <p className="text-gray-500 mt-1">
            基于多维度分析的智能投资推荐
            {lastUpdate && (
              <span className="ml-2 text-sm">
                · 更新于 {lastUpdate.toLocaleTimeString('zh-CN')}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchRecommendations}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* 推荐卡片网格 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {recommendations.map((rec) => {
          const badge = getRecommendationBadge(rec.overall_score);
          const riskBadge = getRiskBadge(rec.risk_level);
          const isPositive = parseFloat(rec.change_24h) >= 0;

          return (
            <div
              key={rec.pair}
              className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1"
              onClick={() => setSelectedRec(selectedRec?.pair === rec.pair ? null : rec)}
            >
              {/* 顶部渐变条 */}
              <div className={`h-2 bg-gradient-to-r ${getScoreColor(rec.overall_score)}`} />

              <div className="p-6">
                {/* 头部信息 */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{rec.pair.replace('_', '/')}</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      ${rec.current_price.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`${badge.color} text-white px-3 py-1 rounded-full text-sm font-semibold inline-flex items-center gap-1`}>
                      <span>{badge.icon}</span>
                      <span>{badge.text}</span>
                    </div>
                    <div className={`${riskBadge.color} px-3 py-1 rounded-full text-xs font-semibold mt-2 inline-flex items-center gap-1`}>
                      <span>{riskBadge.icon}</span>
                      <span>{rec.risk_level}</span>
                    </div>
                  </div>
                </div>

                {/* 24h 变化 */}
                <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg ${isPositive ? 'bg-green-50' : 'bg-red-50'}`}>
                  {isPositive ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`text-lg font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? '+' : ''}{rec.change_24h}%
                  </span>
                  <span className="text-sm text-gray-600">24小时</span>
                </div>

                {/* 综合评分 */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">综合评分</span>
                    <span className="text-2xl font-bold text-gray-900">{rec.overall_score}/100</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${getScoreColor(rec.overall_score)} transition-all duration-500`}
                      style={{ width: `${rec.overall_score}%` }}
                    />
                  </div>
                </div>

                {/* 建议仓位 */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg mb-4">
                  <span className="text-sm font-medium text-gray-700">建议仓位</span>
                  <span className="text-lg font-bold text-blue-600">{rec.suggested_position}</span>
                </div>

                {/* 展开详情 */}
                {selectedRec?.pair === rec.pair && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-4 animate-fadeIn">
                    {/* 五维评分 */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800 mb-3">详细评分</h4>
                      <ScoreBar label="趋势分析" score={rec.trend_score} icon={TrendingUp} />
                      <ScoreBar label="技术指标" score={rec.technical_score} icon={BarChart3} />
                      <ScoreBar label="成交量" score={rec.volume_score} icon={Zap} />
                      <ScoreBar label="波动率" score={rec.volatility_score} icon={Target} />
                      <ScoreBar label="市场情绪" score={rec.sentiment_score} icon={Shield} />
                    </div>

                    {/* 价格目标 */}
                    {rec.price_targets && (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">目标位1</p>
                          <p className="font-bold text-green-600">${rec.price_targets.target1}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">目标位2</p>
                          <p className="font-bold text-blue-600">${rec.price_targets.target2}</p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 mb-1">止损位</p>
                          <p className="font-bold text-red-600">${rec.price_targets.stop_loss}</p>
                        </div>
                      </div>
                    )}

                    {/* 分析要点 */}
                    {rec.analysis_points && rec.analysis_points.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">分析要点</h4>
                        <ul className="space-y-2">
                          {rec.analysis_points.map((point, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 操作策略 */}
                    {rec.strategy && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">💡 操作策略</h4>
                        <p className="text-sm text-gray-700">{rec.strategy}</p>
                      </div>
                    )}

                    {/* 风险提示 */}
                    {rec.risk_warning && (
                      <div className="bg-amber-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">⚠️ 风险提示</h4>
                        <p className="text-sm text-gray-700">{rec.risk_warning}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 展开/收起按钮 */}
                <button
                  className="w-full mt-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRec(selectedRec?.pair === rec.pair ? null : rec);
                  }}
                >
                  {selectedRec?.pair === rec.pair ? '收起详情 ▲' : '查看详情 ▼'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {recommendations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">暂无投资建议</p>
        </div>
      )}
    </div>
  );
}
