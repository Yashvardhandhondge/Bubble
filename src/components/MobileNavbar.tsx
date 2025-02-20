import React, { useState } from 'react';
import { Search, Menu } from 'lucide-react';
import { ViewType } from '../types';
import Bubbles from '../../public/Bubbles';
import Settings from "../../public/Settings";

interface MobileNavbarProps {
  onViewChange: (view: ViewType) => void;
  currentView: ViewType;
}

export const MobileNavbar: React.FC<MobileNavbarProps> = ({ onViewChange, currentView }) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
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

      <div className="fixed bottom-0 left-0 right-0 h-[5vh]  z-50 px-4 flex items-center justify-end">
        <div className="flex border border-white rounded-lg overflow-hidden">
          <button 
            onClick={() => onViewChange('chart')}
            className={`flex items-center justify-center w-[60px] h-[50px] ${currentView === 'chart' ? 'bg-blue-800' : 'bg-gray-800'} text-white`}
          >
            <Bubbles />
          </button>
          
          <button 
            onClick={() => onViewChange('settings')}
            className={`flex items-center justify-center w-[60px] h-[50px] ${currentView === 'settings' ? 'bg-blue-800' : 'bg-gray-800'} text-white`}
          >
            <Settings />
          </button>
          
          <button 
            onClick={() => onViewChange('menu')}
            className={`flex items-center justify-center w-[60px] h-[50px] ${currentView === 'menu' ? 'bg-blue-800' : 'bg-gray-800'} text-white`}
          >
            <Menu />
          </button>
        </div>
      </div>
    </>
  );
};