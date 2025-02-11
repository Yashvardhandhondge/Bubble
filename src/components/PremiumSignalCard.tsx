import React, { useState } from 'react';
import { ChevronRight, ChevronDown, AlertTriangle } from 'lucide-react';
import { SignalData } from '../types';
// import TradingView from './TradingView';

interface PremiumSignalCardProps {
  signal: SignalData;
}

export const PremiumSignalCard: React.FC<PremiumSignalCardProps> = ({ signal }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const extractPrice = (description: string): string => {
    const priceMatch = description.match(/\$(\d+(?:\.\d+)?)/);
    return priceMatch ? priceMatch[1] : '';
  };

  return (
    <div 
      className="bg-[#08190C] border border-[#05621C] rounded-lg p-4 relative overflow-hidden cursor-pointer"
      style={{
        height: isExpanded ? 'auto' : '120px', 
        minHeight: '120px', 
        maxHeight: isExpanded ? '300px' : '120px',
        transition: 'all 0.3s ease-in-out'
      }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="absolute top-2 left-4 right-4 flex justify-between items-start"> 
        <span className="text-xl font-bold text-white flex items-center gap-1"> {/* Reduced gap-2 to gap-1 */}
          <span className="">$</span>
          {signal.symbol}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-orange-400 text-sm">15m ago</span> {/* Removed flex and mb-1 */}
          <div className="text-gray-400">
            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
        </div>
      </div>
      <div className="relative pt-7"> 
        <div className="mb-2">
          <span className="text-2xl font-bold text-white flex items-center gap-1">
            <span className="text-gray-400 text-lg">$</span>
            {extractPrice(signal.description)}
          </span>
        </div>

        {/* Stats with consistent spacing */}
        <div className="flex items-center justify-between gap-3 text-sm mb-2"> {/* Reduced gaps */}
          <div className="flex items-center gap-1 text-gray-300">
            <span>Dangers: <span className='text-white'>{signal.risks.length}/4</span> </span>
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="flex items-center gap-1 ">
            <span className='text-gray-400'>Risk: <span className='text-white'>44/100</span></span>
          </div>
        </div>

        {/* Expanded Content */}
        <div 
          className="transition-all duration-200 ease-in-out"
          style={{
            opacity: isExpanded ? 1 : 0,
            transform: isExpanded ? 'translateY(0)' : 'translateY(-10px)',
            maxHeight: isExpanded ? '200px' : '0',
            overflow: 'hidden',
            visibility: isExpanded ? 'visible' : 'hidden'
          }}
        >
          {/* Good Points */}
          <div className="mb-4 pt-2"> {/* Added top padding */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-emerald-400 text-xl">✓</span>
              <h4 className="text-emerald-400 font-medium">The Good</h4>
            </div>
            <p className="text-gray-300 ml-6">
              4 cycles are at the bottom
            </p>
          </div>

          {/* Bad Points */}
          <div className="pt-1"> {/* Added top padding */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-rose-400 text-xl">✕</span>
              <h4 className="text-rose-400 font-medium">The Bad</h4>
            </div>
            <p className="text-gray-300 ml-6">
              3-Day Cycle is falling, can indicate further downside
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};