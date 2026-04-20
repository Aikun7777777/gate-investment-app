import React, { useState, useEffect } from 'react';
import { useGateAPI } from '../hooks/useGateAPI';
import { formatPrice, formatPercent } from '../utils/formatter';

function Dashboard({ onPairSelect }) {
  const { getAccount, getConfig } = useGateAPI();
  const [account, setAccount] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const [accountData, configData] = await Promise.all([
      getAccount(),
      getConfig()
    ]);

    if (accountData.success) {
      setAccount(accountData);
    }

    if (configData.success) {
      const pairs = configData.config?.trading?.watched_pairs || ['BTC_USDT', 'ETH_USDT', 'SOL_USDT'];
      setWatchlist(pairs);
    }

    setLoading(false);
  };

  const totalBalance = account?.balances?.reduce((sum, b) => {
    if (b.currency === 'USDT') return sum + b.available;
    return sum;
  }, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-secondary rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-2">总资产 (USDT)</div>
          <div className="text-3xl font-bold">{formatPrice(totalBalance)}</div>
        </div>

        <div className="bg-secondary rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-2">今日盈亏</div>
          <div className="text-3xl font-bold text-success">+0.00%</div>
        </div>

        <div className="bg-secondary rounded-lg p-6 border border-gray-700">
          <div className="text-gray-400 text-sm mb-2">持仓币种</div>
          <div className="text-3xl font-bold">{account?.balances?.length || 0}</div>
        </div>
      </div>

      <div className="bg-secondary rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4">监控列表</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {watchlist.map(pair => (
            <button
              key={pair}
              onClick={() => onPairSelect(pair)}
              className="bg-accent hover:bg-blue-600 rounded-lg p-4 text-left transition-colors"
            >
              <div className="font-bold">{pair.replace('_', '/')}</div>
              <div className="text-sm text-gray-400 mt-1">点击查看</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-secondary rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4">账户余额</h2>
        {loading ? (
          <div className="text-gray-400">加载中...</div>
        ) : (
          <div className="space-y-2">
            {account?.balances?.map(balance => (
              <div key={balance.currency} className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="font-medium">{balance.currency}</span>
                <div className="text-right">
                  <div>{balance.available.toFixed(4)}</div>
                  {balance.locked > 0 && (
                    <div className="text-sm text-gray-400">锁定: {balance.locked.toFixed(4)}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
