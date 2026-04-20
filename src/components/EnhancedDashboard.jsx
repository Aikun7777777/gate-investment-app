import { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity, AlertCircle, Bell } from 'lucide-react';
import { useGateAPI } from '../hooks/useGateAPI';

export default function EnhancedDashboard({ onPairSelect }) {
  const { getPrice, getAccount, getAlerts } = useGateAPI();
  const [prices, setPrices] = useState({});
  const [priceHistory, setPriceHistory] = useState({});
  const [account, setAccount] = useState(null);
  const [alerts, setAlerts] = useState({ active: 0, triggered: 0 });
  const [loading, setLoading] = useState(true);

  const watchedPairs = ['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'XRP_USDT'];

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    // 加载价格数据
    const pricePromises = watchedPairs.map(pair => getPrice(pair));
    const priceResults = await Promise.all(pricePromises);

    const newPrices = {};
    priceResults.forEach((result, index) => {
      if (result.success) {
        const pair = watchedPairs[index];
        newPrices[pair] = result;

        // 更新价格历史
        setPriceHistory(prev => {
          const history = prev[pair] || [];
          const newHistory = [...history, {
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            price: result.last
          }];
          // 只保留最近20个数据点
          return {
            ...prev,
            [pair]: newHistory.slice(-20)
          };
        });
      }
    });
    setPrices(newPrices);

    // 加载账户数据
    const accountResult = await getAccount();
    if (accountResult.success) {
      setAccount(accountResult);
    }

    // 加载预警数据
    const alertsResult = await getAlerts();
    if (alertsResult.success) {
      setAlerts({
        active: alertsResult.active?.length || 0,
        triggered: alertsResult.triggered?.length || 0
      });
    }

    setLoading(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatChange = (change) => {
    const num = parseFloat(change);
    return num >= 0 ? `+${num.toFixed(2)}%` : `${num.toFixed(2)}%`;
  };

  const getChangeColor = (change) => {
    return parseFloat(change) >= 0 ? 'text-green-500' : 'text-red-500';
  };

  const getChangeBgColor = (change) => {
    return parseFloat(change) >= 0 ? 'bg-green-500/10' : 'bg-red-500/10';
  };

  // 计算总资产价值
  const calculateTotalValue = () => {
    if (!account?.balances) return 0;

    let total = 0;
    account.balances.forEach(balance => {
      if (balance.currency === 'USDT') {
        total += balance.available + balance.locked;
      } else {
        const pair = `${balance.currency}_USDT`;
        const price = prices[pair]?.last || 0;
        total += (balance.available + balance.locked) * price;
      }
    });
    return total;
  };

  // 资产分布数据
  const getAssetDistribution = () => {
    if (!account?.balances) return [];

    const distribution = [];
    const totalValue = calculateTotalValue();

    account.balances.forEach(balance => {
      const total = balance.available + balance.locked;
      if (total > 0) {
        let value = 0;
        if (balance.currency === 'USDT') {
          value = total;
        } else {
          const pair = `${balance.currency}_USDT`;
          const price = prices[pair]?.last || 0;
          value = total * price;
        }

        if (value > 0) {
          distribution.push({
            name: balance.currency,
            value: value,
            percentage: (value / totalValue * 100).toFixed(2)
          });
        }
      }
    });

    return distribution.sort((a, b) => b.value - a.value);
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">总资产价值</p>
              <p className="text-3xl font-bold mt-2">{formatPrice(calculateTotalValue())}</p>
            </div>
            <DollarSign className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">持仓币种</p>
              <p className="text-3xl font-bold mt-2">{account?.balances?.length || 0}</p>
            </div>
            <Activity className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">活跃预警</p>
              <p className="text-3xl font-bold mt-2">{alerts.active}</p>
            </div>
            <Bell className="w-12 h-12 text-orange-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">已触发预警</p>
              <p className="text-3xl font-bold mt-2">{alerts.triggered}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-purple-200" />
          </div>
        </div>
      </div>

      {/* 价格卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {watchedPairs.map(pair => {
          const data = prices[pair];
          if (!data) return null;

          const symbol = pair.replace('_USDT', '');
          const history = priceHistory[pair] || [];

          return (
            <div
              key={pair}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => onPairSelect && onPairSelect(pair)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{symbol}</h3>
                    <p className="text-sm text-gray-500">USDT</p>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getChangeBgColor(data.change_24h)}`}>
                    {parseFloat(data.change_24h) >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`font-semibold ${getChangeColor(data.change_24h)}`}>
                      {formatChange(data.change_24h)}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-3xl font-bold text-gray-800">{formatPrice(data.last)}</p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-600">
                    <span>高: {formatPrice(data.high_24h)}</span>
                    <span>低: {formatPrice(data.low_24h)}</span>
                  </div>
                </div>

                {/* 迷你价格图表 */}
                {history.length > 1 && (
                  <ResponsiveContainer width="100%" height={80}>
                    <AreaChart data={history}>
                      <defs>
                        <linearGradient id={`gradient-${pair}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={parseFloat(data.change_24h) >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={parseFloat(data.change_24h) >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke={parseFloat(data.change_24h) >= 0 ? '#10b981' : '#ef4444'}
                        fill={`url(#gradient-${pair})`}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 资产分布图 */}
      {getAssetDistribution().length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6">资产分布</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getAssetDistribution()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getAssetDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatPrice(value)} />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-3">
              {getAssetDistribution().map((asset, index) => (
                <div key={asset.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-semibold text-gray-800">{asset.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">{formatPrice(asset.value)}</p>
                    <p className="text-sm text-gray-500">{asset.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
