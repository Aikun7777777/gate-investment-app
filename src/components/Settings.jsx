import React, { useState, useEffect } from 'react';
import { useGateAPI } from '../hooks/useGateAPI';

function Settings() {
  const { getConfig } = useGateAPI();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const data = await getConfig();
    if (data.success) {
      setConfig(data.config);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-secondary rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4">系统设置</h2>

        {loading ? (
          <div className="text-gray-400">加载中...</div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">API 配置</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-accent rounded">
                  <span className="text-gray-300">测试网模式</span>
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    config?.gate?.testnet ? 'bg-success/20 text-success' : 'bg-gray-700 text-gray-300'
                  }`}>
                    {config?.gate?.testnet ? '已启用' : '已禁用'}
                  </span>
                </div>

                <div className="p-3 bg-accent rounded">
                  <div className="text-gray-300 mb-2">API Key</div>
                  <div className="font-mono text-sm text-gray-400 break-all">
                    {config?.gate?.testnet_api_key ?
                      `${config.gate.testnet_api_key.substring(0, 8)}...${config.gate.testnet_api_key.substring(config.gate.testnet_api_key.length - 8)}`
                      : '未配置'}
                  </div>
                </div>

                <div className="p-3 bg-accent rounded">
                  <div className="text-gray-300 mb-2">API Secret</div>
                  <div className="font-mono text-sm text-gray-400">
                    {config?.gate?.testnet_api_secret ? '••••••••••••••••' : '未配置'}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">交易配置</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-accent rounded">
                  <span className="text-gray-300">默认滑点</span>
                  <span className="font-mono">{(config?.trading?.default_slippage * 100).toFixed(2)}%</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-accent rounded">
                  <span className="text-gray-300">最大持仓 (USD)</span>
                  <span className="font-mono">${config?.trading?.max_position_usd?.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-accent rounded">
                  <span className="text-gray-300">定投功能</span>
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    config?.trading?.enable_dca ? 'bg-success/20 text-success' : 'bg-gray-700 text-gray-300'
                  }`}>
                    {config?.trading?.enable_dca ? '已启用' : '已禁用'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">监控列表</h3>
              <div className="p-3 bg-accent rounded">
                <div className="flex flex-wrap gap-2">
                  {config?.trading?.watched_pairs?.map(pair => (
                    <span key={pair} className="px-3 py-1 bg-blue-600 rounded text-sm">
                      {pair.replace('_', '/')}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">通知设置</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-accent rounded">
                  <span className="text-gray-300">价格预警</span>
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    config?.notification?.price_alerts ? 'bg-success/20 text-success' : 'bg-gray-700 text-gray-300'
                  }`}>
                    {config?.notification?.price_alerts ? '已启用' : '已禁用'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-accent rounded">
                  <span className="text-gray-300">交易通知</span>
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    config?.notification?.trade_executed ? 'bg-success/20 text-success' : 'bg-gray-700 text-gray-300'
                  }`}>
                    {config?.notification?.trade_executed ? '已启用' : '已禁用'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-accent rounded">
                  <span className="text-gray-300">盈亏阈值</span>
                  <span className="font-mono">{(config?.notification?.pnl_threshold * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-600/10 border border-blue-600 rounded">
              <p className="text-sm text-blue-400">
                💡 配置文件位置: ~/.openclaw/gate-config.json
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;
