import React, { useState, useEffect } from 'react';
import { useGateAPI } from '../hooks/useGateAPI';
import { formatPrice } from '../utils/formatter';

function Portfolio() {
  const { getAccount } = useGateAPI();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccount();
    const interval = setInterval(loadAccount, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadAccount = async () => {
    const data = await getAccount();
    if (data.success) {
      setAccount(data);
    }
    setLoading(false);
  };

  const totalUSDT = account?.balances?.reduce((sum, b) => {
    if (b.currency === 'USDT') return sum + b.available + b.locked;
    return sum;
  }, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="bg-secondary rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-4">资产总览</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-gray-400 text-sm mb-2">总资产 (USDT)</div>
            <div className="text-3xl font-bold">{formatPrice(totalUSDT)}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm mb-2">可用资产</div>
            <div className="text-3xl font-bold text-success">
              {formatPrice(account?.balances?.reduce((sum, b) => sum + b.available, 0) || 0)}
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-sm mb-2">冻结资产</div>
            <div className="text-3xl font-bold text-warning">
              {formatPrice(account?.balances?.reduce((sum, b) => sum + b.locked, 0) || 0)}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-secondary rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold">现货账户</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-accent">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">币种</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">可用</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">冻结</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">总计</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-400">
                    加载中...
                  </td>
                </tr>
              ) : !account?.balances || account.balances.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-400">
                    暂无资产
                  </td>
                </tr>
              ) : (
                account.balances.map((balance) => (
                  <tr key={balance.currency} className="hover:bg-accent transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold">{balance.currency}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-mono">
                      {balance.available.toFixed(8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-warning">
                      {balance.locked.toFixed(8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-bold">
                      {(balance.available + balance.locked).toFixed(8)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Portfolio;
