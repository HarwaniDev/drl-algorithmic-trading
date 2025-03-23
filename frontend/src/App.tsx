import React, { useState, useEffect } from 'react';
import { LineChart as LucideLineChart, BarChart as LucideBarChart, Activity, TrendingUp, Brain, Github, Twitter, Linkedin } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import axios from 'axios';
import ChatBot from './components/ChatBot';

interface MetricsBoxProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
}

interface RealTimeData {
  prediction: {
    action: number;
    confidence: number;
  };
  trading_signal: {
    tdqn_decision: {
      target_position: number;
      position_change: number;
      confidence: number;
    };
    current_state: {
      position: number;
    };
  };
  performance_metrics: {
    "Performance Indicator": string[];
    "TDQN": string[];
  };
  timing: {
    feature_calculation: number;
    tensor_conversion: number;
    model_inference: number;
    total_time: number;
  };
  data_info: {
    last_update: string;
    interval: string;
    symbol: string;
    window_size: number;
    total_records_available: number;
    date_range: {
      start: string;
      end: string;
    };
    trading_days_found: number;
    calendar_days_searched: number;
    price_change_percent: number;
    current_price: number;
  };
}

interface StockOption {
  symbol: string;
  name: string;
  modelPath: string;
}

const AVAILABLE_STOCKS: StockOption[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', modelPath: 'TDQN_AAPL_2012-1-1_2018-1-1.pth' },
  { symbol: '7203.T', name: 'Toyota Motor Corp.', modelPath: 'TDQN_7203.T_2012-1-1_2018-1-1.pth' },
  { symbol: 'SHEL', name: 'Shell PLC', modelPath: 'TDQN_SHEL_2012-1-1_2018-1-1.pth' },
  { symbol: 'TSLA', name: 'Tesla Inc.', modelPath: 'TDQN_TSLA_2012-1-1_2018-1-1.pth' },
  { symbol: 'VOW3.DE', name: 'Volkswagen AG', modelPath: 'TDQN_VOW3.DE_2012-1-1_2018-1-1.pth' },
];

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
  const [selectedStock, setSelectedStock] = useState<StockOption>(AVAILABLE_STOCKS[0]);
  const [strategy] = useState('TDQN');
  const [realTimeData, setRealTimeData] = useState<RealTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRealTimeData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/real_time_prediction', {
        params: {
          symbol: selectedStock.symbol,
          model_path: selectedStock.modelPath
        }
      });
      setRealTimeData(response.data);
      console.log(response.data);
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch real-time data. Please try again later.');
      console.error('Error fetching real-time data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealTimeData();
  }, [selectedStock]); // Refetch when selected stock changes

  useEffect(() => {
    // Set up polling every 5 minutes
    const interval = setInterval(fetchRealTimeData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedStock]);

  // Transform performance metrics for display
  const metrics = realTimeData ? {
    pnl: realTimeData.performance_metrics.TDQN[0],
    annualReturn: realTimeData.performance_metrics.TDQN[1],
    volatility: realTimeData.performance_metrics.TDQN[2],
    sharpeRatio: realTimeData.performance_metrics.TDQN[3],
    sortinoRatio: realTimeData.performance_metrics.TDQN[4],
    maxDrawdown: realTimeData.performance_metrics.TDQN[5],
    drawdownDuration: realTimeData.performance_metrics.TDQN[6],
    profitability: realTimeData.performance_metrics.TDQN[7],
    profitLossRatio: realTimeData.performance_metrics.TDQN[8],
    skewness: realTimeData.performance_metrics.TDQN[9]
  } : {
    pnl: '0',
    annualReturn: '0%',
    volatility: '0%',
    sharpeRatio: '0',
    sortinoRatio: '0',
    maxDrawdown: '0%',
    drawdownDuration: '0 days',
    profitability: '0%',
    profitLossRatio: '0',
    skewness: '0'
  };

  // Generate data for charts based on real-time data
  const capitalData = realTimeData ? Array.from({ length: realTimeData.data_info.trading_days_found }, (_, i) => {
    const baseCapital = 10000;
    const dailyChange = parseFloat(metrics.pnl) / realTimeData.data_info.trading_days_found;
    const cumulativeChange = dailyChange * (i + 1);
    const date = new Date();
    date.setDate(date.getDate() - (realTimeData.data_info.trading_days_found - i - 1));
    return {
      timestamp: date.toISOString().split('T')[0],
      capital: baseCapital * (1 + cumulativeChange / 100)
    };
  }) : [];

  const priceData = realTimeData ? Array.from({ length: realTimeData.data_info.trading_days_found }, (_, i) => {
    const basePrice = realTimeData.data_info.current_price;
    const dailyChange = realTimeData.data_info.price_change_percent / realTimeData.data_info.trading_days_found;
    const cumulativeChange = dailyChange * (i + 1);
    const date = new Date();
    date.setDate(date.getDate() - (realTimeData.data_info.trading_days_found - i - 1));
    return {
      timestamp: date.toISOString().split('T')[0],
      price: basePrice * (1 + cumulativeChange / 100)
    };
  }) : [];

  const sharpeData = realTimeData ? Array.from({ length: 10 }, (_, i) => ({
    episode: i + 1,
    sharpe: parseFloat(metrics.sharpeRatio) * (0.8 + Math.random() * 0.4)
  })) : [];

  const qValueData = realTimeData ? Array.from({ length: 10 }, (_, i) => ({
    time: `T${i + 1}`,
    buy: realTimeData.trading_signal.tdqn_decision.confidence * (0.6 + Math.random() * 0.4),
    sell: realTimeData.trading_signal.tdqn_decision.confidence * (0.2 + Math.random() * 0.3),
    hold: realTimeData.trading_signal.tdqn_decision.confidence * (0.1 + Math.random() * 0.2)
  })) : [];

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
            <select
              value={selectedStock.symbol}
              onChange={(e) => {
                const stock = AVAILABLE_STOCKS.find(s => s.symbol === e.target.value);
                if (stock) setSelectedStock(stock);
              }}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500/20 transition-all duration-200 bg-gray-800 text-white"
            >
              {AVAILABLE_STOCKS.map(stock => (
                <option key={stock.symbol} value={stock.symbol}>
                  {stock.name} ({stock.symbol})
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-300 mb-2">Strategy</label>
            <input
              type="text"
              value="TDQN"
              disabled
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-700 bg-gray-800 text-gray-500 cursor-not-allowed"
            />
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
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="#9CA3AF"
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    domain={['dataMin - 100', 'dataMax + 100']}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Capital']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="capital" 
                    stroke="#60A5FA" 
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1000}
                    animationEasing="ease-in-out"
                  />
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
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="#9CA3AF"
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    domain={['dataMin - 1', 'dataMax + 1']}
                    tickFormatter={(value) => `$${value.toFixed(2)}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Price']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#34D399" 
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={true}
                    animationDuration={1000}
                    animationEasing="ease-in-out"
                  />
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
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-6">Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <MetricsBox 
              title="Profit & Loss" 
              value={metrics.pnl}
              isPositive={parseFloat(metrics.pnl) > 0}
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <MetricsBox 
              title="Annualized Return" 
              value={metrics.annualReturn}
              isPositive={parseFloat(metrics.annualReturn) > 0}
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <MetricsBox 
              title="Sharpe Ratio" 
              value={metrics.sharpeRatio}
              isPositive={parseFloat(metrics.sharpeRatio) > 0}
              icon={<Activity className="w-5 h-5" />}
            />
            <MetricsBox 
              title="Maximum Drawdown" 
              value={metrics.maxDrawdown}
              isPositive={false}
              icon={<Activity className="w-5 h-5" />}
            />
            <MetricsBox 
              title="Profitability" 
              value={metrics.profitability}
              isPositive={parseFloat(metrics.profitability) > 50}
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <MetricsBox 
              title="Maximum Drawdown Duration" 
              value={metrics.drawdownDuration}
              icon={<Activity className="w-5 h-5" />}
            />
            <MetricsBox 
              title="Profit/Loss Ratio" 
              value={metrics.profitLossRatio}
              isPositive={parseFloat(metrics.profitLossRatio) > 1}
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <MetricsBox 
              title="Annualized Volatility" 
              value={metrics.volatility}
              icon={<Activity className="w-5 h-5" />}
            />
            <MetricsBox 
              title="Sortino Ratio" 
              value={metrics.sortinoRatio}
              isPositive={parseFloat(metrics.sortinoRatio) > 0}
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

      {/* Add ChatBot */}
      {realTimeData && <ChatBot metrics={metrics} selectedStock={{ symbol: selectedStock.symbol, name: selectedStock.name }} />}

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* About Section */}
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold text-white mb-4">About DRL Trading</h3>
              <p className="text-gray-400">
                Advanced algorithmic trading platform powered by Deep Reinforcement Learning, 
                providing real-time market analysis and automated trading signals.
              </p>
            </div>
            
            {/* Quick Links */}
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a href="https://drive.google.com/file/d/1Gs-FjVfHaPndnS7X9tlq-QqshtqVu_If/view?usp=drivesdk" 
                     className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                    Research Papers
                  </a>
                </li>
              </ul>
            </div>

            {/* Connect */}
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-semibold text-white mb-4">Connect</h3>
              <div className="flex space-x-4">
                <a href="https://github.com/HarwaniDev/drl-algorithmic-trading" 
                   className="text-gray-400 hover:text-blue-400 transition-colors duration-200">
                  <Github className="w-6 h-6" />
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