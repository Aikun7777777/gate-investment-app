import React, { useState, useEffect } from 'react';
import { useGateAPI } from '../hooks/useGateAPI';
import { formatPrice, formatPercent, formatVolume } from '../utils/formatter';

function MarketWatch({ onPairSelect }) {
  const { getPrice, getConfig } = useGateAPI();
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarkets();
    const interval = setInterval(loadMarkets, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadMarkets = async () => {
    const configData = await getConfig();
    const pairs = configData.config?.trading?.watched_pairs || ['BTC_USDT', 'ETH_USDT', 'SOL_USDT'];

    const marketData = await Promise.all(
      pairs.map(async (pair) => {
        const data = await getPrice(pair);
        return { pair, ...data };
      })
    );

    setMarkets(marketData.filter(m => m.success));
    setLoading(false);
  };

  return (
    <div className="bg-secondary rounded-lg border border-gray-700">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold">实时行情监控</h2>
        <p className="text-sm text-gray-400 mt-1">每 3 秒自动刷新</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-accent">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">交易对</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">最新价</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">24h 涨跌</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">24h 高</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">24h 低</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">24h 量</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                  加载中...
                </td>
              </tr>
            ) : markets.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                  暂无数据
                </td>
              </tr>
            ) : (
              markets.map((market) => {
                const change = parseFloat(market.change_24h || 0);
                const isPositive = change >= 0;

                return (
                  <tr key={market.pair} className="hover:bg-accent transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold">{market.pair.replace('_', '/')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-mono">
                      {formatPrice(market.last)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right font-bold ${
                      isPositive ? 'text-success' : 'text-danger'
                    }`}>
                      {formatPercent(market.change_24h)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-gray-300">
                      {formatPrice(market.high_24h)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-gray-300">
                      {formatPrice(market.low_24h)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-gray-300">
                      {formatVolume(market.volume_24h)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => onPairSelect(market.pair)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-sm transition-colors"
                      >
                        交易
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MarketWatch;
