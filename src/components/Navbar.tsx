import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ChevronDown, 
  Plus, 
  SlidersHorizontal, 
  X,
  Menu,
  Filter 
} from 'lucide-react';
import { FaTelegram } from "react-icons/fa";
import { useData } from '../context/DataContext';

interface Strategy {
  id: string;
  name: string;
  type: 'short' | 'long' | 'rsi';
  filters?: {
    skipTraps?: boolean;
    avoidHype?: boolean;
    minMarketCap?: number;
  };
}

interface Token {
  id: string;
  name: string;
  type: 'binance' | 'bybit' | 'ai';
}

interface NavbarProps {
  onRangeChange: (range: string) => void;
  onStrategyChange?: (strategy: Strategy) => void;
  onTokenSourceChange?: (source: Token['type']) => void;
}

export const Navbar = ({ 
  onRangeChange, 
  onStrategyChange,
  onTokenSourceChange 
}: NavbarProps) => {
  const { filters, updateFilters } = useData();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showRankDropdown, setShowRankDropdown] = useState(false);
  const [showStrategySelector, setShowStrategySelector] = useState(false);
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRange, setSelectedRange] = useState("Top 100");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStrategyId, setActiveStrategyId] = useState('1');
  const [selectedTokenType, setSelectedTokenType] = useState<'binance' | 'bybit' | 'ai'>('binance');

  const [selectedStrategies, setSelectedStrategies] = useState<Strategy[]>([
    { id: '1', name: 'Short-Term', type: 'short' },
    { id: '2', name: 'Long-Term', type: 'long' }
  ]);

  const [selectedTokens, setSelectedTokens] = useState<Token[]>([
    { id: '1', name: 'Binance', type: 'binance' },
    { id: '2', name: 'Bybit', type: 'bybit' }
  ]);

  const allStrategies: Strategy[] = [
    { id: '1', name: 'Short-Term', type: 'short' },
    { id: '2', name: 'Long-Term', type: 'long' },
    { id: '3', name: 'RSI', type: 'rsi' }
  ];

  const allTokens: Token[] = [
    { id: '1', name: 'Binance', type: 'binance' },
    { id: '2', name: 'Bybit', type: 'bybit' },
    { id: '3', name: 'AI Agent', type: 'ai' }
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setShowRankDropdown(false);
        setShowStrategySelector(false);
        setShowTokenSelector(false);
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRangeChange = (range: string) => {
    setSelectedRange(range);
    setShowRankDropdown(false);
    onRangeChange(range);
  };

  const toggleStrategy = (strategy: Strategy) => {
    if (selectedStrategies.find(s => s.id === strategy.id)) {
      if (selectedStrategies.length > 1) {
        setSelectedStrategies(selectedStrategies.filter(s => s.id !== strategy.id));
        if (strategy.id === activeStrategyId) {
          const remainingStrategies = selectedStrategies.filter(s => s.id !== strategy.id);
          setActiveStrategyId(remainingStrategies[0].id);
          onStrategyChange?.(remainingStrategies[0]);
        }
      }
    } else {
      const updatedStrategies = [...selectedStrategies, strategy];
      setSelectedStrategies(updatedStrategies);
      onStrategyChange?.(strategy);
    }
  };

  const toggleToken = (token: Token) => {
    setSelectedTokenType(token.type);
    if (!selectedTokens.find(t => t.id === token.id)) {
      const updatedTokens = [...selectedTokens, token];
      setSelectedTokens(updatedTokens);
      onTokenSourceChange?.(token.type);
    }
  };

  return (
    <div className="flex flex-col w-full bg-gray-900">
      {/* Main Navbar */}
      <div className="flex flex-col lg:flex-row items-center justify-between p-4 bg-gray-800/50">
        <div className="flex items-center gap-2 mb-4 lg:mb-0">
          <img
            src="https://i.ibb.co/znbC3SV/Group.jpg"
            alt="Coinchart.fun"
            className="w-8 h-8 lg:w-10 lg:h-10 rounded-full"
          />
          <span className="text-xl lg:text-2xl font-bold text-white">Coinchart.fun</span>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-4 w-full lg:w-auto">
          {/* Search Bar */}
          <div className="relative w-full lg:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Crypto..."
              className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg
                border border-gray-700 focus:border-blue-500 focus:outline-none
                placeholder-gray-500"
            />
          </div>

          {/* Range Selector */}
          <div className="relative dropdown-container">
            <button
              onClick={() => setShowRankDropdown(!showRankDropdown)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 w-full lg:w-auto justify-center"
            >
              {selectedRange}
              <ChevronDown size={20} />
            </button>

            {showRankDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg z-50">
                <div className="p-2 space-y-1">
                  {["Top 100", "101 - 200", "201 - 300", "301 - 400"].map((range) => (
                    <label
                      key={range}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded cursor-pointer"
                      onClick={() => handleRangeChange(range)}
                    >
                      <input
                        type="radio"
                        name="rank"
                        className="text-blue-500"
                        checked={selectedRange === range}
                        onChange={() => handleRangeChange(range)}
                      />
                      <span className="text-white">{range}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* API Access Link */}
          <a 
            href="https://t.me/coinchart_api" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-gray-300 hover:text-white whitespace-nowrap"
          >
            API Access
            <FaTelegram size={14} className="text-blue-400" />
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="lg:hidden p-2 text-gray-400 hover:text-white"
        >
          {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Strategy & Token Selection Bar */}
      <div className={`flex flex-col lg:flex-row items-start lg:items-center justify-start p-4 bg-black space-y-4 lg:space-y-0 ${showMobileMenu ? '' : 'hidden lg:flex'}`}>
        {/* Strategy Selection */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 w-full lg:w-auto">
          <span className="text-white whitespace-nowrap">Strategies:</span>
          <div className="flex flex-wrap gap-2">
            {selectedStrategies.map(strategy => (
              <div key={strategy.id} className="relative">
                <button
                  onClick={() => {
                    setActiveStrategyId(strategy.id);
                    onStrategyChange?.(strategy);
                  }}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-colors
                    ${strategy.id === activeStrategyId 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                  {strategy.name}
                  {strategy.type === 'short' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFilters(!showFilters);
                      }}
                    >
                      <SlidersHorizontal size={18} />
                    </button>
                  )}
                </button>

                {/* Strategy Filters Dropdown */}
                {strategy.type === 'short' && showFilters && (
                  <div className="absolute left-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-lg z-50">
                    <div className="p-4 space-y-3">
                      <h3 className="text-white font-semibold mb-2">Filters</h3>
                      <div className="space-y-2">
                        {Object.entries(filters).map(([key, value]) => (
                          <label key={key} className="flex items-center gap-2 text-white">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => updateFilters({ [key]: e.target.checked })}
                              className="rounded bg-gray-700 border-gray-600"
                            />
                            <span className="text-sm">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Add Strategy Button */}
            <button
              onClick={() => setShowStrategySelector(!showStrategySelector)}
              className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"
            >
              {showStrategySelector ? <X size={20} /> : <Plus size={20} />}
            </button>
          </div>
        </div>

        {/* Token Selection */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 w-full lg:w-auto mt-4 lg:mt-0 lg:ml-8">
          <span className="text-white whitespace-nowrap">Token:</span>
          <div className="flex flex-wrap gap-2">
            {selectedTokens.map(token => (
              <button
                key={token.id}
                onClick={() => {
                  setSelectedTokenType(token.type);
                  onTokenSourceChange?.(token.type);
                }}
                className={`px-4 py-1.5 rounded-full transition-colors
                  ${token.type === selectedTokenType
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              >
                {token.name}
              </button>
            ))}
            
            {/* Add Token Button */}
            <button
              onClick={() => setShowTokenSelector(!showTokenSelector)}
              className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"
            >
              {showTokenSelector ? <X size={20} /> : <Plus size={20} />}
            </button>
          </div>
        </div>

        {/* Strategy Selector Dropdown */}
        {showStrategySelector && (
          <div className="absolute left-72 top-36 w-48 bg-gray-800 rounded-lg shadow-lg z-50">
            <div className="p-2">
              {allStrategies.map(strategy => (
                <button
                  key={strategy.id}
                  onClick={() => toggleStrategy(strategy)}
                  className={`w-full text-left px-3 py-2 rounded transition-colors ${
                    selectedStrategies.some(s => s.id === strategy.id)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {strategy.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Token Selector Dropdown */}
        {showTokenSelector && (
          <div className="absolute right-72 top-36 w-48 bg-gray-800 rounded-lg shadow-lg z-50">
            <div className="p-2">
              {allTokens.map(token => (
                <button
                  key={token.id}
                  onClick={() => toggleToken(token)}
                  className={`w-full text-left px-3 py-2 rounded transition-colors ${
                    selectedTokens.some(t => t.id === token.id)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {token.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}