import React,{createContext,useContext,useState,useEffect} from "react";
import api from "../services/api";
import { useAccount } from "wagmi";

interface FavoritesContextType {
    favorites: string[];
    isLoadingFavorites: boolean;
    addFavorite: (coinId: string) => Promise<boolean>;
    removeFavorite: (coinId: string) => Promise<boolean>;
    isFavorite: (coinId: string) => boolean;
    showOnlyFavorites: boolean;
    setShowOnlyFavorites: (show: boolean) => void;
  }
  
  const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);
  
  export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [favorites, setFavorites] = useState<string[]>([]);
    const [isLoadingFavorites, setIsLoadingFavorites] = useState<boolean>(false);
    const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);
    const { address: walletAddress, isConnected } = useAccount();
  
    // Load favorites when wallet is connected
    useEffect(() => {
      const fetchFavorites = async () => {
        if (!isConnected || !walletAddress) {
          setFavorites([]);
          return;
        }
  
        setIsLoadingFavorites(true);
        try {
          const response = await api.get(`/auth/favorites/${walletAddress}`);
          if (response.data.success) {
            setFavorites(response.data.favorites || []);
          }
        } catch (error) {
          console.error('Error fetching favorites:', error);
        } finally {
          setIsLoadingFavorites(false);
        }
      };
  
      fetchFavorites();
    }, [walletAddress, isConnected]);
  
    const addFavorite = async (coinId: string) => {
      if (!isConnected || !walletAddress) return false;
  
      try {
        const response = await api.post('/auth/favorites/add', {
          walletAddress,
          coinId
        });
  
        if (response.data.success) {
          setFavorites(response.data.favorites || []);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error adding favorite:', error);
        return false;
      }
    };
  
    const removeFavorite = async (coinId: string) => {
      if (!isConnected || !walletAddress) return false;
  
      try {
        const response = await api.post('/auth/favorites/remove', {
          walletAddress,
          coinId
        });
  
        if (response.data.success) {
          setFavorites(response.data.favorites || []);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error removing favorite:', error);
        return false;
      }
    };
  
    const isFavorite = (coinId: string) => {
      return favorites.includes(coinId);
    };
  
    return (
      <FavoritesContext.Provider
        value={{
          favorites,
          isLoadingFavorites,
          addFavorite,
          removeFavorite,
          isFavorite,
          showOnlyFavorites,
          setShowOnlyFavorites
        }}
      >
        {children}
      </FavoritesContext.Provider>
    );
  };
  
  export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (context === undefined) {
      throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
  };