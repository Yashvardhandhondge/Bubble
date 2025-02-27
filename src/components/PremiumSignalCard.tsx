import React, { useState } from 'react';
import { ChevronRight, ChevronDown, AlertTriangle } from 'lucide-react';
import { SignalData } from '../types';
// Remove the invalid import for TradingView asset
// Replace it with a constant URL from public folder
const tradingViewImgURL = "/Trading.png";

// Add this helper function
const computeElapsedTime = (dateString: string): string => {
  const past = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  const remainingMins = diffMins % 60;
  if (diffHours < 24) return `${diffHours}h ${remainingMins}m ago`;
  const diffDays = Math.floor(diffHours / 24);
  const remainingHours = diffHours % 24;
  return `${diffDays}d ${remainingHours}h ago`;
};

interface PremiumSignalCardProps {
  signal: SignalData;
}

export const PremiumSignalCard: React.FC<PremiumSignalCardProps> = ({ signal }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Updated function to handle undefined description and fallback to signal.price
  const extractPrice = (description?: string): string => {
    if (!description) return String(signal.price);
    const priceMatch = description.match(/\$(\d+(?:\.\d+)?)/);
    return priceMatch ? priceMatch[1] : String(signal.price);
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
          {/* Replace static text with computed elapsed time */}
          <span className="text-orange-400 text-sm">{computeElapsedTime(signal.date)}</span>
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
        <div className="flex items-center justify-between gap-3 text-sm mb-2">
          <div className="flex items-center gap-1 text-gray-300">
            <span>
              Warnings: <span className='text-white'>{signal.warnings?.length ?? signal.warning_count ?? 0}/4</span>
            </span>
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="flex items-center gap-1">
            <span className='text-gray-400'>
              Risk: <span className='text-white'>{signal.risk}</span>
            </span>
            {/* Render TradingView asset as a widget link */}
            <a href={signal.link} target="_blank" rel="noopener noreferrer">
              <img src={tradingViewImgURL} alt="TradingView Widget" className="w-4 h-4 ml-2 rounded-full" />
            </a>
          </div>
        </div>

        {/* Expanded Content */}
        <div 
          className="custom-scrollbar transition-all duration-200 ease-in-out"
          style={{
            opacity: isExpanded ? 1 : 0,
            transform: isExpanded ? 'translateY(0)' : 'translateY(-10px)',
            maxHeight: isExpanded ? '200px' : '0',
            overflowY: 'auto',
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
      {/* Inline style for scrollbar for this component */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #000;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #555;
          border-radius: 3px;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #555 #000;
        }
      `}</style>
    </div>
  );
};