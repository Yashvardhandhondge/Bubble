import React, { useEffect } from 'react';
import { X, Star } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useAccount } from 'wagmi';

const TokenWidget = ({ tokenData, onClose }) => {
    const { isFavorite, addFavorite, removeFavorite } = useFavorites();
    const { isConnected } = useAccount();
    
    const toggleFavorite = async (e) => {
        e.stopPropagation();
        
        if (!isConnected || !tokenData?.symbol) return;
        
        if (isFavorite(tokenData.symbol)) {
            await removeFavorite(tokenData.symbol);
        } else {
            await addFavorite(tokenData.symbol);
        }
    };
    
    const isFav = tokenData?.symbol ? isFavorite(tokenData.symbol) : false;
    
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const loadWidget = () => {
            if (!tokenData?.chainId || !tokenData?.tokenAddress) {
                console.error('Missing chainId or tokenAddress for token widget');
                return;
            }
            
            if (typeof window.createTokenWget === 'function') {
                window.createTokenWget('token-chart-container', {
                    chainId: tokenData.chainId,
                    tokenAddress: tokenData.tokenAddress,
                });
            } else {
                console.error('createTokenWget function is not defined.');
            }
        };
        
        if (!document.getElementById('moralis-token-widget')) {
            const script = document.createElement('script');
            script.id = 'moralis-token-widget';
            script.src = 'https://moralis.com/static/embed/token.js';
            script.type = 'text/javascript';
            script.async = true;
            script.onload = loadWidget;
            script.onerror = () => {
                console.error('Failed to load the chart widget script.');
            };
            document.body.appendChild(script);
        } else {
            loadWidget();
        }
    }, [tokenData]);
    
    // Format percentages
    const formatPercentage = (value) => {
        if (value === undefined || value === null) return 'N/A';
        return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
    };
    
    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="relative w-full h-[85vh] bg-gray-900 max-w-6xl mx-4 rounded-lg overflow-hidden">
                {/* Header with token info, close and favorite buttons */}
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between bg-gray-800/90 p-3 z-10">
                    <div className="flex items-center gap-3">
                        {tokenData?.icon && (
                            <img 
                                src={tokenData.icon} 
                                alt={tokenData.symbol || "Token"} 
                                className="w-8 h-8 rounded-full"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/default.png';
                                }}
                            />
                        )}
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold text-white">{tokenData?.symbol}</h3>
                                <span className={`text-base ${tokenData.risk > 70 ? 'text-red-500' : 'text-green-500'}`}>
                                    Risk: {tokenData?.risk?.toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex gap-4 text-sm">
                                <span className="text-gray-300">
                                    Price: <span className="text-white">
                                        ${tokenData?.price < 0.0001 ? tokenData.price.toExponential(6) : tokenData.price.toFixed(6)}
                                    </span>
                                </span>
                                <span className="text-gray-300">
                                    1M: <span className={tokenData?.["1mChange"] >= 0 ? 'text-green-500' : 'text-red-500'}>
                                        {formatPercentage(tokenData?.["1mChange"])}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                </div>
                
                {/* Token chart container */}
                <div 
                    id="token-chart-container" 
                    className="w-full h-full pt-14" 
                />
            </div>
        </div>
    );
};

export default TokenWidget;