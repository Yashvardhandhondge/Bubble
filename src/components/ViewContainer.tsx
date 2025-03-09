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

// ViewContainer.tsx - Updated renderTokenSelector function

const renderTokenSelector = () => (
  <div className="flex flex-nowrap gap-2 mb-4 overflow-x-auto pb-2 w-full">
    <div className="flex flex-nowrap gap-2 min-w-min">
      {allTokens.map(token => (
        <div key={token.id} className="relative filter-container flex-shrink-0">
          {token.type === 'ai' && (
            <div className="absolute -top-2 left-0 right-0 flex justify-center">
              <div className="bg-black rounded-full px-2 py-0.5 shadow-md flex items-center gap-1 text-xs">
                <span className="font-medium text-white">Soon</span>
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
              </div>
            </div>
          )}
          <button 
            onClick={() => {
              if (token.type !== 'ai') {
                setSelectedToken(token.type);
                setCurrentToken(token.type.toLowerCase());
              }
            }}
            className={`px-4 py-1.5 rounded-full whitespace-nowrap ${
              selectedToken === token.type 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            } ${token.type === 'ai' ? 'opacity-75 cursor-default' : ''}`}
            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
            disabled={token.type === 'ai'}
          >
            {token.name}
          </button>
        </div>
      ))}
    </div>
  </div>
);

  const renderStrategyButtons = () => (
    <div className="flex flex-nowrap gap-2 mb-4 overflow-x-auto pb-2 w-full">
      <div className="flex flex-nowrap gap-2 min-w-min">
        {selectedStrategies.map(strategy => (
          <div key={strategy.id} className="relative filter-container flex-shrink-0">
            {(strategy.type === 'long' || strategy.type === 'rsi') && (
              <div className="absolute -top-2 left-0 right-0 flex justify-center">
                <div className="bg-black rounded-full px-2 py-0.5 shadow-md flex items-center gap-1 text-xs">
                  <span className="font-medium text-white">Soon</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                </div>
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (strategy.type === 'long' || strategy.type === 'rsi') {
                  // Render tooltip "Coming Soon" above the clicked button
                  const rect = e.currentTarget.getBoundingClientRect();
                  setComingSoon({ x: rect.left + rect.width / 2, y: rect.top });
                  setTimeout(() => setComingSoon(null), 2000);
                } else {
                  setActiveStrategy(strategy.id);
                }
              }}
              className={`px-4 py-1.5 rounded-full flex items-center whitespace-nowrap ${
                strategy.isActive ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-600'
              } ${(strategy.type === 'long' || strategy.type === 'rsi') ? 'opacity-75 cursor-default' : ''}`}
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
          </div>
        ))}
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

  const [comingSoon, setComingSoon] = useState<{ x: number; y: number } | null>(null);

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