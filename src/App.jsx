import React, { useState } from 'react';
import EnhancedDashboard from './components/EnhancedDashboard';
import MarketWatch from './components/MarketWatch';
import Trading from './components/Trading';
import Portfolio from './components/Portfolio';
import FundingArbitrage from './components/FundingArbitrage';
import EnhancedRecommendations from './components/EnhancedRecommendations';
import PriceAlerts from './components/PriceAlerts';
import PerformanceMonitor from './components/PerformanceMonitor';
import Settings from './components/Settings';

function App() {
  const [activeTab, setActiveTab] = useState('recommendations');
  const [selectedPair, setSelectedPair] = useState('BTC_USDT');

  const tabs = [
    { id: 'recommendations', name: '投资建议', icon: '💡' },
    { id: 'alerts', name: '价格预警', icon: '🔔' },
    { id: 'dashboard', name: '仪表板', icon: '📊' },
    { id: 'market', name: '行情监控', icon: '📈' },
    { id: 'trading', name: '交易', icon: '💹' },
    { id: 'portfolio', name: '资产', icon: '💰' },
    { id: 'funding', name: '资金费率', icon: '🔄' },
    { id: 'performance', name: '性能监控', icon: '⚡' },
    { id: 'settings', name: '设置', icon: '⚙️' }
  ];

  const handlePairSelect = (pair) => {
    setSelectedPair(pair);
    setActiveTab('trading');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">G</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Gate 投资助手</h1>
              <p className="text-xs text-gray-500">智能投资决策平台</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">主网模式</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex space-x-1 px-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>
      </nav>

      <main className="p-6">
        {activeTab === 'recommendations' && <EnhancedRecommendations />}
        {activeTab === 'alerts' && <PriceAlerts />}
        {activeTab === 'dashboard' && <EnhancedDashboard onPairSelect={handlePairSelect} />}
        {activeTab === 'market' && <MarketWatch onPairSelect={handlePairSelect} />}
        {activeTab === 'trading' && <Trading pair={selectedPair} />}
        {activeTab === 'portfolio' && <Portfolio />}
        {activeTab === 'funding' && <FundingArbitrage />}
        {activeTab === 'performance' && <PerformanceMonitor />}
        {activeTab === 'settings' && <Settings />}
      </main>
    </div>
  );
}

export default App;
