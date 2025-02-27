import React from "react";
import { Star } from "lucide-react";
import { useFavorites } from "../context/FavoritesContext";
import { useAccount } from "wagmi";

interface FavoriteButtonProps {
    coinId: string;
    className?: string;
    size?: number;
  }
  
  const FavoriteButton: React.FC<FavoriteButtonProps> = ({ 
    coinId, 
    className = '',
    size = 20
  }) => {
    const { isFavorite, addFavorite, removeFavorite } = useFavorites();
    const { isConnected } = useAccount();
    
    const toggleFavorite = async (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent event bubbling to parent elements
      
      if (!isConnected) {
        // Could show a notification that wallet connection is required
        return;
      }
      
      if (isFavorite(coinId)) {
        await removeFavorite(coinId);
      } else {
        await addFavorite(coinId);
      }
    };
    
    // Don't render if wallet not connected
    if (!isConnected) {
      return null;
    }
    
    const isFav = isFavorite(coinId);
    
    return (
      <button
        onClick={toggleFavorite}
        className={`transition-all duration-200 ${className}`}
        title={isFav ? "Remove from favorites" : "Add to favorites"}
      >
        <Star 
          size={size} 
          fill={isFav ? "#FFD700" : "none"} 
          color={isFav ? "#FFD700" : "white"} 
          className={`transition-all ${isFav ? 'scale-110' : 'scale-100'}`}
        />
      </button>
    );
  };
  
  export default FavoriteButton;