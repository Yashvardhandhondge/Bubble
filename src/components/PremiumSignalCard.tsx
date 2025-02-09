import React, { useState } from 'react';
import { ChevronRight, ChevronDown, AlertTriangle } from 'lucide-react';
import { SignalData } from '../types';

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
      className={`bg-[#103118]/50 border border-[#05621C] rounded-lg transition-all duration-200 ${
        isExpanded ? 'p-6' : 'p-4'
      }`}
    >
      {/* Header Row */}
      <div className="flex justify-between items-center">
        <span className="text-xl font-bold text-white">${signal.symbol}</span>
        <div className="flex items-center gap-2">
          <span className="text-orange-400 text-sm">15m ago</span>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-300"
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Price */}
      <div className="text-2xl font-bold text-white mt-1">
        ${extractPrice(signal.description)}
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 mt-2 text-gray-300 text-sm">
        <div className="flex items-center gap-1">
          <span>Dangers: {signal.risks.length}/4</span>
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
        </div>
        <div className="flex items-center gap-1">
          <span>Risk: 44/100</span>
          {/* <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-xs">ℹ️</span> */}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Good Points */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 text-xl">✓</span>
              <h4 className="text-emerald-400 font-medium">The Good</h4>
            </div>
            <p className="text-gray-300 ml-6 mt-1">
              4 cycles are at the bottom
            </p>
          </div>

          {/* Bad Points */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-rose-400 text-xl">✕</span>
              <h4 className="text-rose-400 font-medium">The Bad</h4>
            </div>
            <p className="text-gray-300 ml-6 mt-1">
              3-Day Cycle is falling, can indicate further downside
            </p>
          </div>
        </div>
      )}
    </div>
  );
};