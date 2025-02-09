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
      className="bg-[#103118]/50 border border-[#05621C] rounded-lg p-4 relative overflow-hidden cursor-pointer"
      style={{
        height: isExpanded ? '280px' : '100px',
        transition: 'height 0.2s ease-in-out'
      }}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <span className="text-xl font-bold text-white">${signal.symbol}</span>
        <div className="flex items-center gap-2">
          <span className="text-orange-400 text-sm flex items-center">15m ago</span>
          <div className="text-gray-400">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </div>
        </div>
      </div>

      {/* Price - Now static */}
      <div className="absolute top-14 left-4 text-2xl font-bold text-white">
        ${extractPrice(signal.description)}
      </div>

      {/* Stats Row - Now static */}
      <div className="absolute top-24 left-4 flex items-center gap-4 text-gray-300 text-sm">
        <div className="flex items-center gap-1">
          <span>Dangers: {signal.risks.length}/4</span>
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
        </div>
        <div className="flex items-center gap-1">
          <span>Risk: 44/100</span>
        </div>
      </div>

      {/* Expanded Content - Now uses transform for smooth animation */}
      <div 
        className="absolute top-36 left-4 right-4 transition-transform duration-200 ease-in-out"
        style={{
          transform: isExpanded ? 'translateY(0)' : 'translateY(-20px)',
          opacity: isExpanded ? 1 : 0,
          visibility: isExpanded ? 'visible' : 'hidden',
          transition: 'transform 0.2s ease, opacity 0.2s ease, visibility 0.2s'
        }}
      >
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
    </div>
  );
};