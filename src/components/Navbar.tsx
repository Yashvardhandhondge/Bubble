import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ChevronDown, 
  Plus, 
  SlidersHorizontal, 
  X,
  Menu 
} from 'lucide-react';
import { FaTelegram } from "react-icons/fa";
import { useData } from '../context/DataContext';

interface Filters {
  skipTraps: boolean;
  avoidHype: boolean;
  minMarketCap: boolean;
}

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
  type: 'binance' | 'BTCC' | 'ai';
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
  const [selectedTokenType, setSelectedTokenType] = useState<'binance' | 'BTCC' | 'ai'>('binance');
  const [activeFilterStrategyId, setActiveFilterStrategyId] = useState<string | null>(null);

  const [selectedStrategies, setSelectedStrategies] = useState<Strategy[]>([
    { id: '1', name: 'Short-Term', type: 'short' },
    { id: '2', name: 'Long-Term', type: 'long' }
  ]);

  const [selectedTokens, setSelectedTokens] = useState<Token[]>([
    { id: '1', name: 'Binance', type: 'binance' },
    { id: '2', name: 'BTCC', type: 'BTCC' }
  ]);

  const allStrategies: Strategy[] = [
    { id: '1', name: 'Short-Term', type: 'short' },
    { id: '2', name: 'Long-Term', type: 'long' },
    { id: '3', name: 'RSI', type: 'rsi' }
  ];

  const allTokens: Token[] = [
    { id: '1', name: 'Binance', type: 'binance' },
    { id: '2', name: 'BTCC', type: 'BTCC' },
    { id: '3', name: 'AI Agent', type: 'ai' }
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (target.closest('.filters-dropdown') || 
          (target.closest('.filters-button') && !showFilters)) {
        return;
      }

      if (!target.closest('.dropdown-container')) {
        setShowRankDropdown(false);
        setShowStrategySelector(false);
        setShowTokenSelector(false);
        if (!target.closest('.filters-button')) {
          setShowFilters(false);
          setActiveFilterStrategyId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilters]);

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

  const handleFilterClick = (strategyId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (activeFilterStrategyId === strategyId) {
      setShowFilters(false);
      setActiveFilterStrategyId(null);
    } else {
      setShowFilters(true);
      setActiveFilterStrategyId(strategyId);
    }
  };

  const handleFilterOptionClick = (filterKey: keyof Filters, value: boolean, event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    updateFilters({ [filterKey]: value });
  };

  return (
    <div className="flex flex-col w-full bg-gray-900">

      <div className="flex flex-col h-16 lg:flex-row items-center justify-between p-4 bg-gray-800/50"> {/* Changed p-4 to p-5 to match BuySignalsPanel */}
        <div className="flex items-center gap-2 mb-4 lg:mb-0">
          <img
            src="/fav.png"
            alt="Coinchart.fun"
            className="w-8 h-8 lg:w-10 lg:h-10 rounded-full"
          />
          <span className="text-xl lg:text-2xl font-bold text-white">Coinchart.fun</span>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-4 w-full lg:w-auto">
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

         
          <a 
            href="http://t.me/adamwernee" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-white hover:text-white whitespace-nowrap"
          >
            API Access
            <FaTelegram size={14} className="text-blue-400" />
          </a>
        </div>

        
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="lg:hidden p-2 text-gray-400 hover:text-white"
        >
          {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

   
      <div className={`flex flex-col lg:flex-row items-start lg:items-center justify-start p-3 bg-black space-y-4 lg:space-y-0 ${showMobileMenu ? '' : 'hidden lg:flex'}`}>
     
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
                      className="filters-button ml-1"
                      onClick={(e) => handleFilterClick(strategy.id, e)}
                    >
                      <SlidersHorizontal size={18} />
                    </button>
                  )}
                </button>

                {strategy.type === 'short' && 
                 showFilters && 
                 activeFilterStrategyId === strategy.id && (
                  <div 
                    className="filters-dropdown absolute left-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-lg z-[100]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-4 space-y-3">
                      <h3 className="text-white font-semibold mb-2">Filters</h3>
                      <div className="space-y-2">
                        {Object.entries(filters).map(([key, value]) => (
                          <label 
                            key={key} 
                            className="flex items-center gap-2 text-white cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => handleFilterOptionClick(key as keyof Filters, e.target.checked, e)}
                              className="rounded bg-gray-700 border-gray-600 cursor-pointer"
                            />
                            <span className="text-sm select-none">
                              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={() => setShowStrategySelector(!showStrategySelector)}
              className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"
            >
              {showStrategySelector ? <X size={20} /> : <Plus size={20} />}
            </button>
          </div>
        </div>

      
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 w-full lg:w-auto mt-4 lg:mt-0 lg:ml-8">
          <span className="text-white whitespace-nowrap">Tokens:</span>
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
            
            {/* Wrap the button and dropdown in a relative div */}
            <div className="relative">
              <button
                onClick={() => setShowTokenSelector(!showTokenSelector)}
                className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700"
              >
                {showTokenSelector ? <X size={20} /> : <Plus size={20} />}
              </button>

              {/* Position dropdown below the button */}
              {showTokenSelector && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg z-50">
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
        </div>

    
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

      </div>
    </div>
  );
}