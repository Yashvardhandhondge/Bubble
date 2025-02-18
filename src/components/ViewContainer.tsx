import React, { useState } from 'react';
import { ViewType } from '../types';
import BubbleChart from './BubbleChart2';
import { BuySignalsPanel } from './BuySignalsPanel';
import { Plus } from 'lucide-react';
import { Strategy } from '../types';

interface ViewContainerProps {
  currentView: ViewType;
  selectedRange: string;
  setSelectedRange: (range: string) => void;
}

export const ViewContainer: React.FC<ViewContainerProps> = ({
  currentView,
  selectedRange,
  setSelectedRange
}) => {
  const [selectedStrategies, setSelectedStrategies] = useState<Strategy[]>([
    { id: '1', name: 'Short-Term', type: 'short', isActive: true },
    { id: '2', name: 'Long-Term', type: 'long', isActive: false }
  ]);

  const [selectedToken, setSelectedToken] = useState('Binance');

  const renderView = () => {
    switch (currentView) {
      case 'chart':
        return (
          <div className="min-h-[80vh] flex flex-col">
            <div className="pt-[12vh] px-4 pb-4">
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedToken('Binance')}
                  className={`px-4 py-2 rounded-full ${
                    selectedToken === 'Binance' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-800 text-gray-300'
                  }`}
                >
                  Binance
                </button>
                <button 
                  onClick={() => setSelectedToken('BTCC')}
                  className={`px-4 py-2 rounded-full ${
                    selectedToken === 'BTCC' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-800 text-gray-300'
                  }`}
                >
                  BTCC
                </button>
                <button className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Plus size={20} className="text-white" />
                </button>
              </div>
            </div>

            
            <div className="flex-1">
              <BubbleChart 
                selectedRange={selectedRange}
                onBubbleClick={() => {}}
              />
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="min-h-[80vh] pt-[12vh] pb-[12vh] px-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedStrategies.map(strategy => (
                <button
                  key={strategy.id}
                  className={`px-4 py-2 rounded-full ${
                    strategy.isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-800 text-gray-300'
                  }`}
                >
                  {strategy.name}
                </button>
              ))}
              <button className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Plus size={20} className="text-white" />
              </button>
            </div>
          </div>
        );

      case 'menu':
        return (
          <div className="h-[80vh] pt-[10vh] pb-[10vh] overflow-hidden">
            <BuySignalsPanel />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen">
      {renderView()}
    </div>
  );
};
