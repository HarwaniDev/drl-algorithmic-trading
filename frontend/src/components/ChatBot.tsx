import React, { useState, useEffect } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import axios from 'axios';
// import { config } from 'dotenv';
// config();
interface ChatBotProps {
  metrics: {
    pnl: string;
    annualReturn: string;
    volatility: string;
    sharpeRatio: string;
    sortinoRatio: string;
    maxDrawdown: string;
    drawdownDuration: string;
    profitability: string;
    profitLossRatio: string;
    skewness: string;
  };
  selectedStock: {
    symbol: string;
    name: string;
  };
}

const formatAIResponse = (content: string) => {
  // Split into sections if the response contains headers
  const sections = content.split('**').filter(Boolean);
  
  if (sections.length <= 1) {
    return content; // Return as is if no formatting needed
  }

  return sections.map((section, index) => {
    if (section.toLowerCase().includes('key insights:') || section.toLowerCase().includes('recommendations:')) {
      // This is a header
      return `\n${section.trim()}\n`;
    } else {
      // This is content
      return section.trim();
    }
  }).join('\n');
};

const ChatBot: React.FC<ChatBotProps> = ({ metrics, selectedStock }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>(() => {
    try {
      const savedMessages = localStorage.getItem('chatMessages');
      return savedMessages ? JSON.parse(savedMessages) : [];
    } catch (error) {
      console.error('Error loading chat messages:', error);
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving chat messages:', error);
    }
  }, [messages]);

  const generateInsight = async (userMessage: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const apiKey = import.meta.env.VITE_GROQ_API_KEY || process.env.REACT_APP_GROQ_API_KEY;
      
      if (!apiKey) {
        throw new Error('API key is not configured');
      }

      console.log('Sending request to Groq API...');
      
      const systemMessage = {
        role: 'system',
        content: `You are an AI trading assistant analyzing trading metrics for ${selectedStock.name} (${selectedStock.symbol}). Current metrics:
          PnL: ${metrics.pnl}
          Annual Return: ${metrics.annualReturn}
          Volatility: ${metrics.volatility}
          Sharpe Ratio: ${metrics.sharpeRatio}
          Sortino Ratio: ${metrics.sortinoRatio}
          Max Drawdown: ${metrics.maxDrawdown}
          Drawdown Duration: ${metrics.drawdownDuration}
          Profitability: ${metrics.profitability}
          P/L Ratio: ${metrics.profitLossRatio}
          Skewness: ${metrics.skewness}
          
          Provide concise, professional analysis focusing on key insights and actionable recommendations.
          When discussing metrics, explain their significance and implications for trading decisions under 100 words.`
      };

      const requestBody = {
        model: 'llama-3.3-70b-versatile',
        messages: [
          systemMessage,
          ...messages.map(msg => ({ role: msg.role, content: msg.content })),
          { role: 'user', content: userMessage }
        ],
        max_tokens: 150,
        temperature: 0.7
      };

      console.log('Request configuration:', {
        url: 'https://api.groq.com/openai/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer [HIDDEN]'
        },
        body: requestBody
      });

      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          }
        }
      );

      console.log('Response from Groq API:', response.data);

      if (response.data.choices && response.data.choices[0]?.message) {
        return response.data.choices[0].message.content;
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (error: any) {
      console.error('Error generating insight:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      setError(
        error.response?.data?.error?.message || 
        error.message ||
        'Failed to generate insight. Please check your API key configuration.'
      );
      return 'Sorry, I encountered an error while generating insights. Please check if your API key is properly configured.';
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    const aiResponse = await generateInsight(userMessage);
    setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
  };

  const clearChat = () => {
    setMessages([]);
    try {
      localStorage.removeItem('chatMessages');
    } catch (error) {
      console.error('Error clearing chat messages:', error);
    }
  };

  const MessageContent: React.FC<{ content: string, isAI: boolean }> = ({ content, isAI }) => {
    if (!isAI) return <div>{content}</div>;

    const formattedContent = formatAIResponse(content);
    const lines = formattedContent.split('\n');

    return (
      <div className="space-y-2">
        {lines.map((line, i) => {
          if (line.toLowerCase().includes('key insights:')) {
            return (
              <div key={i} className="font-semibold text-blue-300 border-b border-gray-600 pb-1 mb-2">
                {line}
              </div>
            );
          } else if (line.toLowerCase().includes('recommendations:')) {
            return (
              <div key={i} className="font-semibold text-green-300 border-b border-gray-600 pb-1 mt-3 mb-2">
                {line}
              </div>
            );
          } else if (line.trim()) {
            return <div key={i} className="text-gray-200">{line}</div>;
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg transition-all duration-200"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div className="bg-gray-800 rounded-lg shadow-xl w-96 h-[500px] flex flex-col border border-gray-700">
          <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-white">Trading Assistant</h3>
              <p className="text-sm text-gray-400">{selectedStock.name} ({selectedStock.symbol})</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearChat}
                className="text-gray-400 hover:text-white text-sm"
              >
                Clear
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white ml-2"
              >
                ×
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {messages.length === 0 && !error && (
              <div className="text-gray-400 text-center">
                Ask me about your trading metrics! For example:
                <div className="mt-2 text-blue-400 cursor-pointer hover:text-blue-300"
                     onClick={() => setInput(`Can you analyze the current trading performance of ${selectedStock.symbol} and suggest potential improvements?`)}>
                  "Can you analyze the current trading performance and suggest potential improvements?"
                </div>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700'
                  }`}
                >
                  <MessageContent 
                    content={message.content} 
                    isAI={message.role === 'assistant'} 
                  />
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-gray-200 rounded-lg p-3">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your trading metrics..."
                className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatBot; 