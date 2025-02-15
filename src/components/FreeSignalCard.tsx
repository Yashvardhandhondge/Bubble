import React from 'react';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import { SignalData } from '../types';
import { extractPrice } from '../utils';
import Locksvg from './Locksvg';

interface FreeSignalCardProps {
  signal: SignalData;
  onUpgrade: () => void;
}

export const FreeSignalCard: React.FC<FreeSignalCardProps> = ({ signal, onUpgrade }) => {
  return (
    <div className="bg-[#08190C] border border-[#05621C] rounded-lg p-4 relative overflow-hidden h-[120px] custom-scrollbar">
      {/* Blur overlay with lock */}
      <div 
        className="absolute inset-0 backdrop-blur-[6px] bg-green-900/40 rounded-lg 
        flex items-center justify-center z-10 cursor-pointer"
        style={{
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)'
        }}
        onClick={onUpgrade}
      >
        <Locksvg />
      </div>

      {/* Mirrored Premium Card Content */}
      <div className="absolute top-2 left-4 right-4 flex justify-between items-start">
        <span className="text-xl font-bold text-white flex items-center gap-1">
          <span className="">$</span>
          {signal.symbol}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-orange-400 text-sm">15m ago</span>
          <div className="text-gray-400">
            <ChevronRight className="w-5 h-5" />
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

        <div className="flex items-center justify-between gap-3 text-sm mb-2">
          <div className="flex items-center gap-1 text-gray-300">
            <span>Dangers: <span className="text-white">2/4</span></span>
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-400">Risk: <span className="text-white">44/100</span></span>
          </div>
        </div>
      </div>

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