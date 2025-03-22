import React, { useState } from 'react';
import { LineChart as LucideLineChart, BarChart as LucideBarChart, Activity, TrendingUp, Brain, Github, Twitter, Linkedin } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface MetricsBoxProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
}

const MetricsBox: React.FC<MetricsBoxProps> = ({ title, value, change, isPositive, icon }) => (
  <div className="bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-700">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-medium text-gray-300">{title}</h3>
      {icon && <div className="text-blue-400">{icon}</div>}
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
    {change && (
      <p className={`text-sm mt-2 ${isPositive ? 'text-green-400' : 'text-red-400'} font-medium`}>
        {change}
      </p>
    )}
  </div>
);

function App() {
  const [company, setCompany] = useState('');
  const [strategy, setStrategy] = useState('TDQN');

  const metrics = {
    pnl: '+$12,450',
    annualReturn: '18.5%',
    volatility: '12.3%',
    sharpeRatio: '1.8',
    sortinoRatio: '2.1',
    maxDrawdown: '-15.4%',
    drawdownDuration: '45 days',
    profitability: '68%',
    profitLossRatio: '2.3',
    skewness: '0.45'
  };

  // Sample data for charts
  const capitalData = Array.from({ length: 20 }, (_, i) => ({
    timestamp: `Day ${i + 1}`,
    capital: 10000 + Math.random() * 5000
  }));

  const priceData = Array.from({ length: 20 }, (_, i) => ({
    timestamp: `Day ${i + 1}`,
    price: 100 + Math.random() * 20
  }));

  const sharpeData = Array.from({ length: 10 }, (_, i) => ({
    episode: i + 1,
    sharpe: 0.5 + Math.random() * 2
  }));

  const qValueData = Array.from({ length: 10 }, (_, i) => ({
    time: `T${i + 1}`,
    buy: Math.random() * 0.8,
    sell: Math.random() * 0.6,
    hold: Math.random() * 0.4
  }));

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Brain className="w-10 h-10 text-blue-400" />
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
                DRL Trading Dashboard
              </h1>
              <p className="text-gray-400 mt-1">Powered by Deep Reinforcement Learning</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 py-8">
        {/* Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-300 mb-2">Company</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500/20 transition-all duration-200 bg-gray-800 text-white placeholder-gray-500"
              placeholder="Enter company symbol (e.g., AAPL)"
            />
          </div>
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-300 mb-2">Strategy</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500/20 transition-all duration-200 bg-gray-800 text-white appearance-none"
            >
              <option value="TDQN">TDQN</option>
              <option value="DQN">DQN</option>
            </select>
            <div className="absolute right-3 top-[2.35rem] pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Trading Signal */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-8 mb-8 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Trading Signal</h2>
              <p className="text-gray-400">Market analysis suggests a strong buying opportunity</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="px-6 py-3 bg-green-900/50 text-green-400 rounded-full text-lg font-semibold shadow-lg border border-green-700/50">
                BUY
              </span>
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Capital vs Timestamp */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <div className="flex items-center mb-6">
              <LucideLineChart className="w-6 h-6 mr-2 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Capital vs Timestamp</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={capitalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="timestamp" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                  <Line type="monotone" dataKey="capital" stroke="#60A5FA" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Price vs Timestamp */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <div className="flex items-center mb-6">
              <TrendingUp className="w-6 h-6 mr-2 text-green-400" />
              <h2 className="text-xl font-bold text-white">Price vs Timestamp</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="timestamp" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                  <Line type="monotone" dataKey="price" stroke="#34D399" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sharpe Ratio vs Episode */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <div className="flex items-center mb-6">
              <Activity className="w-6 h-6 mr-2 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Sharpe Ratio vs Episode</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sharpeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="episode" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                  <Line type="monotone" dataKey="sharpe" stroke="#A78BFA" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Q Values vs Time */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
            <div className="flex items-center mb-6">
              <LucideBarChart className="w-6 h-6 mr-2 text-orange-400" />
              <h2 className="text-xl font-bold text-white">Q Values vs Time</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={qValueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                  <Bar dataKey="buy" fill="#F97316" />
                  <Bar dataKey="sell" fill="#EF4444" />
                  <Bar dataKey="hold" fill="#EAB308" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6">Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <MetricsBox 
              title="Maximum Drawdown Duration" 
              value={metrics.drawdownDuration}
              icon={<Activity className="w-5 h-5" />}
            />
            <MetricsBox 
              title="Profitability" 
              value={metrics.profitability}
              isPositive={true}
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <MetricsBox 
              title="Profit/Loss Ratio" 
              value={metrics.profitLossRatio}
              icon={<LucideLineChart className="w-5 h-5" />}
            />
            <MetricsBox 
              title="Annualized Volatility" 
              value={metrics.volatility}
              icon={<Activity className="w-5 h-5" />}
            />
            <MetricsBox 
              title="Skewness" 
              value={metrics.skewness}
              icon={<LucideBarChart className="w-5 h-5" />}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* About Section */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">About DRL Trading</h3>
              <p className="text-gray-400">
                Advanced algorithmic trading platform powered by Deep Reinforcement Learning, 
                providing real-time market analysis and automated trading signals.
              </p>
            </div>
            
            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                    Research Papers
                  </a>
                </li>
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Connect</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                  <Github className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                  <Twitter className="w-6 h-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                  <Linkedin className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-700">
            <p className="text-center text-gray-400">
              © {new Date().getFullYear()} DRL Trading. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;