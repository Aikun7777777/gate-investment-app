import React, { useState, useEffect } from 'react';
import { useGateAPI } from '../hooks/useGateAPI';
import { formatPrice } from '../utils/formatter';

function Trading({ pair }) {
  const { getPrice, getOrderBook, placeOrder } = useGateAPI();
  const [price, setPrice] = useState(null);
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [side, setSide] = useState('buy');
  const [orderType, setOrderType] = useState('limit');
  const [amount, setAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [pair]);

  const loadData = async () => {
    const [priceData, bookData] = await Promise.all([
      getPrice(pair),
      getOrderBook(pair, 10)
    ]);

    if (priceData.success) {
      setPrice(priceData);
      if (!limitPrice) {
        setLimitPrice(priceData.last.toString());
      }
    }

    if (bookData.success) {
      setOrderBook(bookData);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const orderParams = {
      pair,
      side,
      type: orderType,
      amount: parseFloat(amount),
      price: orderType === 'limit' ? parseFloat(limitPrice) : undefined
    };

    const result = await placeOrder(orderParams);

    if (result.success) {
      alert('订单提交成功！');
      setAmount('');
    } else {
      alert(`订单失败: ${result.error}`);
    }

    setLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-secondary rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-bold mb-4">{pair.replace('_', '/')} 订单簿</h3>

          <div className="space-y-2 mb-4">
            <div className="text-xs text-gray-400 flex justify-between">
              <span>价格</span>
              <span>数量</span>
            </div>
            {orderBook.asks.slice(0, 5).reverse().map((ask, i) => (
              <div key={`ask-${i}`} className="flex justify-between text-sm text-danger">
                <span className="font-mono">{formatPrice(ask[0])}</span>
                <span className="font-mono">{ask[1].toFixed(4)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-b border-gray-700 py-2 my-2">
            <div className="text-center font-bold text-lg">
              {price ? formatPrice(price.last) : '---'}
            </div>
          </div>

          <div className="space-y-2 mt-4">
            {orderBook.bids.slice(0, 5).map((bid, i) => (
              <div key={`bid-${i}`} className="flex justify-between text-sm text-success">
                <span className="font-mono">{formatPrice(bid[0])}</span>
                <span className="font-mono">{bid[1].toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="bg-secondary rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-bold mb-4">下单</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setSide('buy')}
                className={`flex-1 py-2 rounded font-medium transition-colors ${
                  side === 'buy' ? 'bg-success text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                买入
              </button>
              <button
                type="button"
                onClick={() => setSide('sell')}
                className={`flex-1 py-2 rounded font-medium transition-colors ${
                  side === 'sell' ? 'bg-danger text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                卖出
              </button>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">订单类型</label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                className="w-full bg-accent border border-gray-600 rounded px-4 py-2 text-white"
              >
                <option value="limit">限价单</option>
                <option value="market">市价单</option>
              </select>
            </div>

            {orderType === 'limit' && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">价格 (USDT)</label>
                <input
                  type="number"
                  step="0.01"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="w-full bg-accent border border-gray-600 rounded px-4 py-2 text-white"
                  placeholder="输入价格"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-2">数量</label>
              <input
                type="number"
                step="0.0001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-accent border border-gray-600 rounded px-4 py-2 text-white"
                placeholder="输入数量"
                required
              />
            </div>

            <div className="bg-accent rounded p-4 text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">预计成交</span>
                <span className="font-mono">
                  {amount && limitPrice ? (parseFloat(amount) * parseFloat(limitPrice)).toFixed(2) : '0.00'} USDT
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded font-bold transition-colors ${
                side === 'buy'
                  ? 'bg-success hover:bg-green-600'
                  : 'bg-danger hover:bg-red-600'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? '提交中...' : side === 'buy' ? '买入' : '卖出'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-warning/10 border border-warning rounded">
            <p className="text-sm text-warning">
              ⚠️ 当前为测试网环境，所有交易均为模拟交易
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Trading;
