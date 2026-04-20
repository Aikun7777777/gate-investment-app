import React, { useState, useEffect } from 'react';
import { useGateAPI } from '../hooks/useGateAPI';

function FundingArbitrage() {
  const { getFundingRates } = useGateAPI();
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRates();
    const interval = setInterval(loadRates, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadRates = async () => {
    const data = await getFundingRates();
    if (data.success) {
      setRates(data.rates);
    }
    setLoading(false);
  };

  const opportunities = rates.filter(r => Math.abs(r.funding_rate) >= 0.001);

  return (
    <div className="space-y-6">
      <div className="bg-secondary rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-bold mb-2">资金费率套利</h2>
        <p className="text-sm text-gray-400">
          资金费率 &gt; 0 时，做空收利息 | &lt; 0 时，做多收利息
        </p>
      </div>

      <div className="bg-secondary rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-bold">主流币资金费率</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-accent">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">币种</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">当前费率</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">年化收益</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">最新价</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase">建议</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                    加载中...
                  </td>
                </tr>
              ) : rates.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                    暂无数据
                  </td>
                </tr>
              ) : (
                rates.map((rate) => {
                  const isPositive = rate.funding_rate > 0;
                  const isOpportunity = Math.abs(rate.funding_rate) >= 0.001;

                  return (
                    <tr key={rate.coin} className="hover:bg-accent transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold">{rate.coin}</div>
                        <div className="text-xs text-gray-400">{rate.name}</div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right font-mono font-bold ${
                        isPositive ? 'text-success' : 'text-danger'
                      }`}>
                        {isPositive ? '🟢' : '🔴'} {(rate.funding_rate * 100).toFixed(4)}%
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right font-mono font-bold ${
                        isPositive ? 'text-success' : 'text-danger'
                      }`}>
                        {rate.annual_rate >= 0 ? '+' : ''}{rate.annual_rate.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-gray-300">
                        ${rate.last_price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {isOpportunity ? (
                          <span className={`px-3 py-1 rounded text-sm font-medium ${
                            isPositive ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
                          }`}>
                            {isPositive ? '做空收息' : '做多收息'}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {opportunities.length > 0 && (
        <div className="bg-secondary rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-bold mb-4">🚨 套利机会（费率 &gt; 0.1%）</h3>
          <div className="space-y-3">
            {opportunities.slice(0, 5).map((opp, i) => (
              <div key={opp.coin} className="bg-accent rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-lg">{i + 1}. {opp.coin}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      {opp.funding_rate > 0 ? '做空' : '做多'} 收利息，年化收益 {opp.annual_rate >= 0 ? '+' : ''}{opp.annual_rate.toFixed(1)}%
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${
                    opp.funding_rate > 0 ? 'text-success' : 'text-danger'
                  }`}>
                    {(opp.funding_rate * 100).toFixed(4)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FundingArbitrage;
