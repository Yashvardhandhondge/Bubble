import React from 'react';

import { SignalData } from '../types';
import { extractPrice } from '../utils';
import Locksvg from './Locksvg';

interface FreeSignalCardProps {
  signal: SignalData;
  onUpgrade: () => void;
}

export const FreeSignalCard: React.FC<FreeSignalCardProps> = ({ signal, onUpgrade }) => {
  return (
    // Wrap the entire card content in a scrollable container in case of overflow
    <div className="custom-scrollbar relative p-4 rounded-xl bg-gray-800/50 border border-gray-700" style={{ overflowY: 'auto' }}>
      <div className="absolute inset-0 bg-green-700/40 backdrop-blur-sm rounded-xl flex items-center justify-center">
        <Locksvg/>
      </div>
      <div className="flex justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl font-semibold text-white">
              ${signal.symbol}
            </span>
          </div>
          <span className="text-xl font-bold text-white">
            ${extractPrice(signal.description)}
          </span>
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