
import React, { useState } from 'react';
import { ChevronUp, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { SignalData } from '../types';
import { extractPrice, extractPercentages } from '../utils';

interface PremiumSignalCardProps {
  signal: SignalData;
}

export const PremiumSignalCard: React.FC<PremiumSignalCardProps> = ({ signal }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="p-4 rounded-xl bg-[#103118]/50 border border-[#05621C]">
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

        <button onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="mt-4">
            <div className="flex items-center gap-2 text-emerald-500 mb-2">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Performance:</span>
            </div>
            {extractPercentages(signal.description).map((percentage, i) => (
              <div
                key={i}
                className={`text-sm ml-6 mb-1 ${
                  percentage.startsWith('-') ? 'text-red-400' : 'text-green-400'
                }`}
              >
                {percentage}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2 text-rose-500 mb-2">
              <XCircle className="w-4 h-4" />
              <span className="font-medium">Risks:</span>
            </div>
            {signal.risks.map((risk, i) => (
              <div key={i} className="text-gray-400 text-sm ml-6 mb-1">
                {risk}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};