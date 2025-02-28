import React, { useState, useEffect } from 'react';
import { ViewType } from '../types';
import { BuySignalsPanel } from './BuySignalsPanel';
import { Plus, SlidersHorizontal, X, Star } from 'lucide-react';
import { Strategy } from '../types';
import MobileBubbleChart from './Bubblechart1';
import { useData } from '../context/DataContext';
import { MobileNavbar } from './MobileNavbar';
import { useFavorites } from '../context/FavoritesContext';
import { useAccount } from 'wagmi';

interface ViewContainerProps {
  selectedRange: string;
  setSelectedRange: (range: string) => void;
}

export const ViewContainer: React.FC<ViewContainerProps> = ({
  selectedRange,
  setSelectedRange
}) => {
  const { setCurrentToken, filters, updateFilters } = useData();
  const { isFavorite, addFavorite, removeFavorite, showOnlyFavorites, setShowOnlyFavorites } = useFavorites();
  const { isConnected } = useAccount();
  const [currentView, setCurrentView] = useState<ViewType>('chart');
  const [selectedStrategies, setSelectedStrategies] = useState<Strategy[]>([
    { id: '1', name: 'Short-Term', type: 'short', isActive: true },
    { id: '2', name: 'Long-Term', type: 'long', isActive: false },
    { id: '3', name: 'RSI', type: 'rsi', isActive: false }
  ]);

  const [selectedToken, setSelectedToken] = useState<'binance' | 'btcc' | 'ai'>('binance');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilterStrategyId, setActiveFilterStrategyId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [filterOptions, setFilterOptions] = useState({
    skipTraps: filters.skipPotentialTraps || false,
    avoidHype: filters.avoidOverhypedTokens || false,
    minMarketCap: filters.marketCapFilter || false,
  });

  const allTokens: Array<{ id: string, name: string, type: 'binance' | 'btcc' | 'ai' }> = [
    { id: '1', name: 'Binance', type: 'binance' },
    { id: '2', name: 'BTCC', type: 'btcc' },
    { id: '3', name: 'AI Agents', type: 'ai' }
  ];

  useEffect(() => {
    setFilterOptions({
      skipTraps: filters.skipPotentialTraps || false,
      avoidHype: filters.avoidOverhypedTokens || false, 
      minMarketCap: filters.marketCapFilter || false
    });
  }, [filters]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (target.closest('.filters-dropdown') || 
          (target.closest('.filters-button') && !showFilters)) {
        return;
      }

      if (!target.closest('.filter-container')) {
        setShowFilters(false);
        setActiveFilterStrategyId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilters]);

  const handleFilterClick = (strategyId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    console.log(`Filter button clicked for strategy ID: ${strategyId}`);
    
    if (activeFilterStrategyId === strategyId) {
      setShowFilters(false);
      setActiveFilterStrategyId(null);
    } else {
      setShowFilters(true);
      setActiveFilterStrategyId(strategyId);
    }
  };

  const handleFilterOptionClick = (filterKey: keyof typeof filterOptions, value: boolean) => {
    const newFilterOptions = {
      ...filterOptions,
      [filterKey]: value
    };
    
    setFilterOptions(newFilterOptions);
    
    const contextFilters = {
      skipPotentialTraps: newFilterOptions.skipTraps,
      avoidOverhypedTokens: newFilterOptions.avoidHype,
      marketCapFilter: newFilterOptions.minMarketCap
    };
    
    updateFilters(contextFilters);
  };
  
  const setActiveStrategy = (strategyId: string) => {
    setSelectedStrategies(prev => 
      prev.map(strategy => ({
        ...strategy,
        isActive: strategy.id === strategyId
      }))
    );
  };

  const toggleFavorite = async (symbol: string) => {
    if (!isConnected || !symbol) return;
    
    if (isFavorite(symbol)) {
      await removeFavorite(symbol);
    } else {
      await addFavorite(symbol);
    }
  };

  const renderTokenSelector = () => (
    <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
      {allTokens.map(token => (
        <div key={token.id} className="relative flex-shrink-0">
          <button 
            onClick={() => {
              setSelectedToken(token.type);
              setCurrentToken(token.type === 'ai' ? "cookiefun" : token.type.toLowerCase());
            }}
            className={`px-4 py-2 rounded-full whitespace-nowrap ${
              selectedToken === token.type 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-300'
            }`}
          >
            {token.name}
          </button>
        </div>
      ))}
      {isConnected && (
        <button
          onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
          className="p-2 text-white"
          title={showOnlyFavorites ? "Show all tokens" : "Show only favorites"}
        >
          <Star 
            size={18} 
            fill={showOnlyFavorites ? "blue" : "none"} 
            color={showOnlyFavorites ? "blue" : "white"} 
          />
        </button>
      )}
    </div>
  );

  const renderStrategyButtons = () => (
    <div className="flex flex-nowrap gap-2 mb-4 overflow-x-auto pb-2 w-full">
      <div className="flex flex-nowrap gap-2 min-w-min">
        {selectedStrategies.map(strategy => (
          <div key={strategy.id} className="relative filter-container flex-shrink-0">
            <button
              onClick={() => setActiveStrategy(strategy.id)}
              className={`px-4 py-2 rounded-full flex items-center whitespace-nowrap ${
                strategy.isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300'
              }`}
              style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
            >
              {strategy.name}
              {strategy.type === 'short' && (
                <button
                  className="filters-button ml-2"
                  onClick={(e) => handleFilterClick(strategy.id, e)}
                >
                  <SlidersHorizontal size={18} />
                </button>
              )}
            </button>
            {showFilters && activeFilterStrategyId === strategy.id && strategy.type === 'short' && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
                <div className="bg-gray-800 rounded-lg w-[90%] max-w-sm mx-auto z-50">
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                      <h3 className="text-white font-medium">Filter Options</h3>
                      <button 
                        onClick={() => {
                          setShowFilters(false);
                          setActiveFilterStrategyId(null);
                        }}
                        className="text-gray-400 hover:text-white"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-gray-300 hover:text-white">
                        <input
                          type="checkbox"
                          checked={filterOptions.skipTraps}
                          onChange={(e) => handleFilterOptionClick('skipTraps', e.target.checked)}
                          className="rounded border-gray-600 text-blue-500 focus:ring-blue-500"
                        />
                        Skip Potential Traps
                      </label>
                      <label className="flex items-center gap-2 text-gray-300 hover:text-white">
                        <input
                          type="checkbox"
                          checked={filterOptions.avoidHype}
                          onChange={(e) => handleFilterOptionClick('avoidHype', e.target.checked)}
                          className="rounded border-gray-600 text-blue-500 focus:ring-blue-500"
                        />
                        Avoid Overhyped Tokens
                      </label>
                      <label className="flex items-center gap-2 text-gray-300 hover:text-white">
                        <input
                          type="checkbox"
                          checked={filterOptions.minMarketCap}
                          onChange={(e) => handleFilterOptionClick('minMarketCap', e.target.checked)}
                          className="rounded border-gray-600 text-blue-500 focus:ring-blue-500"
                        />
                        Min Market Cap Filter
                      </label>
                    </div>
                    <div className="pt-3 border-t border-gray-700 flex justify-end">
                      <button
                        onClick={() => {
                          setShowFilters(false);
                          setActiveFilterStrategyId(null);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {isConnected && (
        <button
          onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
          className="p-2 text-white"
          title={showOnlyFavorites ? "Show all strategies" : "Show only favorites"}
        >
          <Star 
            size={18} 
            fill={showOnlyFavorites ? "blue" : "none"} 
            color={showOnlyFavorites ? "blue" : "white"} 
          />
        </button>
      )}
    </div>
  );

  const renderView = () => {
    switch (currentView) {
      case 'chart':
        return (
          <div className="min-h-[80vh] flex flex-col">
            <div className="pt-[8vh] px-4 pb-4">
              {renderTokenSelector()}
            </div>
            <div className="flex-1">
              <MobileBubbleChart selectedRange={selectedRange} searchQuery={searchQuery} />
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="min-h-[80vh] flex flex-col">
            <div className="pt-[9vh] px-4 pb-4">
              {renderStrategyButtons()}
            </div>
            <div className="flex-1">
              <MobileBubbleChart selectedRange={selectedRange} searchQuery={searchQuery} />
            </div>
          </div>
        );

      case 'menu':
        return (
          <div className="h-[100vh] pt-[8vh] pb-[8vh] overflow-hidden">
            <BuySignalsPanel />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <MobileNavbar
        onViewChange={(view: ViewType) => setCurrentView(view)}
        currentView={currentView}
        selectedRange={selectedRange}
        onRangeChange={setSelectedRange}
        onSearchChange={(query: string) => setSearchQuery(query)}
        showFilters={showFilters}
        activeFilterStrategyId={activeFilterStrategyId}
        handleFilterClick={handleFilterClick}
        handleFilterOptionClick={handleFilterOptionClick}
        filterOptions={filterOptions}
      />
      {renderView()}
    </div>
  );
};

export default ViewContainer;