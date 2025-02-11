import { useState } from 'react';
import { Lock } from 'lucide-react';
import { SignalData } from '../types';
import { extractPrice } from '../utils';

interface SliderSignalProps {
  signal: SignalData;
  onUpgrade: () => void;
}

const SliderSignal = ({ signal, onUpgrade }: SliderSignalProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative w-full h-12 bg-gray-800/50 border border-gray-700 rounded-full overflow-hidden cursor-pointer mb-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onUpgrade}
    >
      {/* Sliding overlay */}
      <div 
        className={`absolute inset-0 bg-green-600/40 backdrop-blur-sm transition-transform duration-300 ease-in-out flex items-center justify-center
          ${isHovered ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Lock className="w-5 h-5 text-white" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-between px-4">
        <span className="text-sm font-semibold text-white">
          ${signal.symbol}
        </span>
        <span className="text-sm font-bold text-white">
          ${extractPrice(signal.description)}
        </span>
      </div>
    </div>
  );
};

export default SliderSignal;
