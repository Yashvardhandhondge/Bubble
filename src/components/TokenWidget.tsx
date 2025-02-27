import React from 'react';
import { X, Star } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useAccount } from 'wagmi';

interface TokenWidgetProps {
  tokenData: any;
  onClose: () => void;
}

const TokenWidget: React.FC<TokenWidgetProps> = ({ tokenData, onClose }) => {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { isConnected } = useAccount();
  
  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isConnected || !tokenData?.symbol) return;
    
    if (isFavorite(tokenData.symbol)) {
      await removeFavorite(tokenData.symbol);
    } else {
      await addFavorite(tokenData.symbol);
    }
  };
  
  const isFav = tokenData?.symbol ? isFavorite(tokenData.symbol) : false;
  
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="relative w-full h-[85vh] bg-gray-900 max-w-6xl mx-4 rounded-lg overflow-hidden">
        {/* Header with close and favorite buttons */}
        <div className="absolute top-0 right-0 flex items-center gap-2 p-4 z-10">
          {isConnected && (
            <button
              onClick={toggleFavorite}
              className="p-2 text-white transition-all duration-200"
            >
              <Star 
                size={22} 
                fill={isFav ? "#FFD700" : "none"} 
                color={isFav ? "#FFD700" : "white"} 
                className={`transition-all ${isFav ? 'scale-110' : 'scale-100'}`}
              />
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

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