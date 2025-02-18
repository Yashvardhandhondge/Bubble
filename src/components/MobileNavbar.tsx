import React, { useState } from 'react';
import { Search, Menu } from 'lucide-react';
import { ViewType } from '../types';
import Bubbles from '../../public/Bubbles';
import Settings from "../../public/Settings"

interface MobileNavbarProps {
  onViewChange: (view: ViewType) => void;
  currentView: ViewType;
}

export const MobileNavbar: React.FC<MobileNavbarProps> = ({ onViewChange, currentView }) => {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <>
      {/* Top Bar - Fixed */}
      <div className="fixed top-0 left-0 right-0 h-[10vh] bg-gray-900 z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/fav.png" alt="Logo" className="w-8 h-8" />
          {!showSearch && <span className="text-white font-bold">Coinchart.fun</span>}
        </div>
        
        <div className={`flex-1 transition-all ${showSearch ? 'ml-4' : 'w-0 overflow-hidden'}`}>
          {showSearch && (
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg"
              />
            </div>
          )}
        </div>

        <button 
          onClick={() => setShowSearch(!showSearch)}
          className="p-2 text-gray-400"
        >
          <Search size={20} />
        </button>
      </div>

      {/* Bottom Bar - Fixed */}
      <div className="fixed bottom-0 left-0 right-0 h-[10vh] bg-gray-900 z-50 px-4 flex items-center justify-between">
        <div className="flex gap-4">
          <button 
            onClick={() => onViewChange('chart')}
            className={`p-2 ${currentView === 'chart' ? 'text-blue-500' : 'text-gray-400'}`}
          >
          <Bubbles  />
          </button>
          
          <button 
            onClick={() => onViewChange('settings')}
            className={`p-2 ${currentView === 'settings' ? 'text-blue-500' : 'text-gray-400'}`}
          >
            <Settings  />
          </button>
          
          <button 
            onClick={() => onViewChange('menu')}
            className={`p-2 ${currentView === 'menu' ? 'text-blue-500' : 'text-gray-400'}`}
          >
            <Menu  />
          </button>
        </div>
      </div>
    </>
  );
};
