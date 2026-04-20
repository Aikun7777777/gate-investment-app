import { useState, useEffect } from 'react';
import { useGateAPI } from '../hooks/useGateAPI';

export default function PriceAlerts() {
  const { getAlerts, addAlert, deleteAlert, checkPriceAlerts } = useGateAPI();
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAlert, setNewAlert] = useState({
    pair: 'BTC_USDT',
    price: '',
    condition: 'above',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const loadAlerts = async () => {
    try {
      const result = await getAlerts();
      if (result.success) {
        setActiveAlerts(result.active || []);
        setTriggeredAlerts(result.triggered || []);
      }
    } catch (error) {
      console.error('加载预警失败:', error);
    }
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 10000); // 每10秒刷新
    return () => clearInterval(interval);
  }, []);

  const handleAddAlert = async (e) => {
    e.preventDefault();
    if (!newAlert.price) return;

    setLoading(true);
    try {
      const result = await addAlert(newAlert);
      if (result.success) {
        setNewAlert({ pair: 'BTC_USDT', price: '', condition: 'above', message: '' });
        setShowAddForm(false);
        await loadAlerts();

        // 显示桌面通知
        if (window.electron) {
          window.electron.showNotification({
            title: '价格预警已添加',
            body: `${newAlert.pair} ${newAlert.condition === 'above' ? '高于' : '低于'} ${newAlert.price}`
          });
        }
      }
    } catch (error) {
      console.error('添加预警失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    try {
      const result = await deleteAlert(alertId);
      if (result.success) {
        await loadAlerts();
      }
    } catch (error) {
      console.error('删除预警失败:', error);
    }
  };

  const getConditionText = (condition) => {
    return condition === 'above' ? '高于' : '低于';
  };

  const getConditionColor = (condition) => {
    return condition === 'above' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6">
      {/* 标题和添加按钮 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">价格预警</h2>
          <p className="text-sm text-gray-500 mt-1">设置价格提醒，及时把握交易机会</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showAddForm ? '取消' : '+ 添加预警'}
        </button>
      </div>

      {/* 添加预警表单 */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">添加新预警</h3>
          <form onSubmit={handleAddAlert} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  交易对
                </label>
                <select
                  value={newAlert.pair}
                  onChange={(e) => setNewAlert({ ...newAlert, pair: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="BTC_USDT">BTC/USDT</option>
                  <option value="ETH_USDT">ETH/USDT</option>
                  <option value="SOL_USDT">SOL/USDT</option>
                  <option value="XRP_USDT">XRP/USDT</option>
                  <option value="DOGE_USDT">DOGE/USDT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  条件
                </label>
                <select
                  value={newAlert.condition}
                  onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="above">价格高于</option>
                  <option value="below">价格低于</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                目标价格
              </label>
              <input
                type="number"
                step="0.01"
                value={newAlert.price}
                onChange={(e) => setNewAlert({ ...newAlert, price: e.target.value })}
                placeholder="输入目标价格"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                备注（可选）
              </label>
              <input
                type="text"
                value={newAlert.message}
                onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                placeholder="添加备注信息"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? '添加中...' : '确认添加'}
            </button>
          </form>
        </div>
      )}

      {/* 活跃预警列表 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">活跃预警 ({activeAlerts.length})</h3>
        {activeAlerts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无活跃预警</p>
        ) : (
          <div className="space-y-3">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-800">{alert.pair}</span>
                    <span className={`font-medium ${getConditionColor(alert.condition)}`}>
                      {getConditionText(alert.condition)} ${alert.target_price}
                    </span>
                  </div>
                  {alert.message && (
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    创建于 {new Date(alert.created_at).toLocaleString('zh-CN')}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteAlert(alert.id)}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 已触发预警列表 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">已触发预警 ({triggeredAlerts.length})</h3>
        {triggeredAlerts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无已触发预警</p>
        ) : (
          <div className="space-y-3">
            {triggeredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-4 bg-green-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-800">{alert.pair}</span>
                    <span className="text-green-600 font-medium">
                      ✓ 已触发
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    目标: {getConditionText(alert.condition)} ${alert.target_price} |
                    触发价格: ${alert.triggered_price}
                  </p>
                  {alert.message && (
                    <p className="text-sm text-gray-600">{alert.message}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    触发于 {new Date(alert.triggered_at).toLocaleString('zh-CN')}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteAlert(alert.id)}
                  className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  清除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
