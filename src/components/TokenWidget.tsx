import React from 'react';
import { X } from 'lucide-react';

interface TokenWidgetProps {
  tokenData: any;
  onClose: () => void;
}

const TokenWidget: React.FC<TokenWidgetProps> = ({ tokenData, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="relative w-full h-[85vh] bg-gray-900 max-w-6xl mx-4 rounded-lg overflow-hidden">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-400 hover:text-white z-10"
        >
          <X size={24} />
        </button>

        {/* Embed the Moralis chart */}
        <iframe
          src={tokenData?.moralisLink}
          className="w-full h-full"
          style={{ border: 'none' }}
          title="Token Chart"
        />
      </div>
    </div>
  );
};

export default TokenWidget;
