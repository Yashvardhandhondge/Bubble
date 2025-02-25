import React, { useState, useRef, useEffect } from 'react';
import { Search, Menu, ChevronDown, X } from 'lucide-react';
import { ViewType } from '../types';
import Bubbles from '../../public/Bubbles';
import Settings from "../../public/Settings";
import { SwapCard } from './Swap/SwapInterface/SwapCard';



interface MobileNavbarProps {
  onViewChange: (view: ViewType) => void;
  currentView: ViewType;
  selectedRange: string;
  onRangeChange: (range: string) => void;
}

export const MobileNavbar: React.FC<MobileNavbarProps> = ({ 
  onViewChange, 
  currentView,
  selectedRange,
  onRangeChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);
  const [showDEX, setShowDEX] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Available range options
  const rangeOptions = [
    "Top 100",
    "101 - 200",
    "201 - 300",
    "301 - 400",
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRangeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleRangeDropdown = () => {
    setShowRangeDropdown(!showRangeDropdown);
  };

  const handleRangeSelect = (range: string) => {
    onRangeChange(range);
    setShowRangeDropdown(false);
  };
  

  return (
    <>
      {/* Top fixed header remains unchanged */}
      <div className="fixed top-0 left-0 right-0 h-[8vh] bg-gray-900 z-50 px-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-2">
          <img src="/fav.png" alt="Logo" className="w-8 h-8" />
          <span className="text-white font-bold">Coinchart.fun</span>
        </div>
        <div className="flex-1 mx-2">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search Crypto Currencies"
              className="w-full h-10 bg-gray-800 text-white pl-10 pr-4 rounded-lg focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-[5vh] z-50 px-4 flex items-center justify-between">
        <div className="relative" ref={dropdownRef}>
          {(currentView === 'chart' || currentView === 'settings') && (
            <>
              <button 
                onClick={toggleRangeDropdown}
                className="flex border mb-4 border-gray-400 bg-[#68686833]/20 items-center gap-1 px-2 py-1 rounded bg-black text-white"
              >
                <span className="text-sm">{selectedRange}</span>
                <ChevronDown size={16} className={showRangeDropdown ? "rotate-180" : ""} />
              </button>
              {showRangeDropdown && (
                <div className="absolute bottom-full left-0  w-32 bg-black border border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
                  {rangeOptions.map((range, index) => (
                    <div 
                      key={index}
                      className="px-3 py-2 hover:bg-gray-800 cursor-pointer text-white text-sm"
                      onClick={() => handleRangeSelect(range)}
                    >
                      {range}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <div>
          {(currentView === 'chart' || currentView === 'settings') && (
            <button
              onClick={() => setShowDEX(true)}
              className="p-1 border border-white bg-[#68686833]/20  mb-4 h-[30px] rounded-full text-white rounded-lg "
            >
              ↓↑
            </button>
          )}
        </div>

        <div className="flex border border-white rounded-lg mb-4 overflow-hidden">
          <button 
            onClick={() => onViewChange('chart')}
            className={`flex items-center justify-center w-[60px] h-[30px] ${currentView === 'chart' ? 'bg-blue-800' : 'bg-gray-800'} text-white`}
          >
            <Bubbles />
          </button>
          <button 
            onClick={() => onViewChange('settings')}
            className={`flex items-center justify-center w-[60px] h-[30x] ${currentView === 'settings' ? 'bg-blue-800' : 'bg-gray-800'} text-white`}
          >
            <Settings />
          </button>
          <button 
            onClick={() => onViewChange('menu')}
            className={`flex items-center justify-center w-[60px] h-[30px] ${currentView === 'menu' ? 'bg-blue-800' : 'bg-gray-800'} text-white`}
          >
            <Menu />
          </button>
        </div>
      </div>

    
      {showDEX && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <SwapCard onClose={() => setShowDEX(false)} />
        </div>
      )}
    </>
  );
};