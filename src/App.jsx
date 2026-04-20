import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import MarketWatch from './components/MarketWatch';
import Trading from './components/Trading';
import Portfolio from './components/Portfolio';
import FundingArbitrage from './components/FundingArbitrage';
import Recommendations from './components/Recommendations';
import Settings from './components/Settings';

function App() {
  const [activeTab, setActiveTab] = useState('recommendations');
  const [selectedPair, setSelectedPair] = useState('BTC_USDT');

  const tabs = [
    { id: 'recommendations', name: '投资建议', icon: '💡' },
    { id: 'dashboard', name: '仪表板', icon: '📊' },
    { id: 'market', name: '行情监控', icon: '📈' },
    { id: 'trading', name: '交易', icon: '💹' },
    { id: 'portfolio', name: '资产', icon: '💰' },
    { id: 'funding', name: '资金费率', icon: '🔄' },
    { id: 'settings', name: '设置', icon: '⚙️' }
  ];

  const handlePairSelect = (pair) => {
    setSelectedPair(pair);
    setActiveTab('trading');
  };

  return (
    <div className="min-h-screen bg-primary text-white">
      <header className="bg-secondary border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Gate 投资助手</h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">测试网模式</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </header>

      <nav className="bg-secondary border-b border-gray-700">
        <div className="flex space-x-1 px-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>
      </nav>

      <main className="p-6">
        {activeTab === 'recommendations' && <Recommendations />}
        {activeTab === 'dashboard' && <Dashboard onPairSelect={handlePairSelect} />}
        {activeTab === 'market' && <MarketWatch onPairSelect={handlePairSelect} />}
        {activeTab === 'trading' && <Trading pair={selectedPair} />}
        {activeTab === 'portfolio' && <Portfolio />}
        {activeTab === 'funding' && <FundingArbitrage />}
        {activeTab === 'settings' && <Settings />}
      </main>
    </div>
  );
}

export default App;
