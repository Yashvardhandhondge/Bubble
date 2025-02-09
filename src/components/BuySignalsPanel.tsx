import React from 'react';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { Crown, User } from 'lucide-react';
import { FaTelegram } from 'react-icons/fa';
import { FreeSignalCard } from './FreeSignalCard';
import { PremiumSignalCard } from './PremiumSignalCard';
import Buttons from './Buttons';
import { useData } from '../context/DataContext';
import { useAccount } from 'wagmi';

export const BuySignalsPanel: React.FC = () => {
  const { signals = [], loading } = useData();
  const { openConnectModal } = useConnectModal();
  const { address } = useAccount();
  
  // Simplified premium check - you can modify this based on your needs
  const isPremiumActive = false; // Default to free tier

  const handleUpgradeToPremium = () => {
    window.open('https://pay.boomfi.xyz/2rwqC9PH4zXMNqTupAXjsNyNJ3v', '_blank');
  };

  const handleTelegramSupport = () => {
    window.open('https://t.me/+1oKOrFd0G2RjYjVk', '_blank');
  };

  return (
    <div className="h-full bg-black flex flex-col">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-center justify-between p-4 h-16">
        <div className="flex items-center gap-2">
          {isPremiumActive ? (
            <>
              <Crown className="w-4 h-4 text-yellow-400" />
              <span className="text-white text-sm">Premium</span>
            </>
          ) : (
            <>
              <User className="w-4 h-4 text-white" />
              <span className="text-white text-sm">Free</span>
            </>
          )}
        </div>

        {address ? (
          <button className="flex items-center gap-2 px-3 py-1.5 bg-[#1B61B3] rounded-full">
            <div className="w-3 h-3 bg-purple-500 rounded-full" />
            <span className="text-xs text-[#DDDDDD]">
              {`${address.slice(0, 6)}...${address.slice(-4)}`}
            </span>
          </button>
        ) : (
          <button onClick={openConnectModal} className="text-sm text-white bg-[#1B61B3] px-4 py-1 rounded-full"> 
            Connect Wallet
          </button>
        )}
      </div>

      {/* Title */}
      <div className="px-4 py-2">
        <h1 className='text-2xl p-7 text-white font-semibold'>Latest Buy Signals</h1>
      </div>

      {/* Signals List */}
      <div className="flex-1 overflow-y-auto px-2 pb-6">
        {loading ? (
          <div className="text-white text-center mt-8">Loading signals...</div>
        ) : signals?.length > 0 ? (
          <div className="space-y-4">
            {signals.map((signal, index) =>
              isPremiumActive ? (
                <PremiumSignalCard key={index} signal={signal} />
              ) : (
                <FreeSignalCard key={index} signal={signal} onUpgrade={handleUpgradeToPremium} />
              )
            )}
          </div>
        ) : (
          <div className="text-white text-center mt-8">No signals available</div>
        )}
      </div>

      {/* Bottom Action Button */}
      <div className="p-4 border-t border-gray-800/50 mb-4">
        {!isPremiumActive ? (
          <button onClick={handleUpgradeToPremium} className="w-full h-full p-4">
            <Buttons/>
          </button>
        ) : (
          <button
            onClick={handleTelegramSupport}
            className="w-full bg-blue-600 px-3 text-white py-2 rounded-lg flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-colors my-2"
          >
            <span>Premium Support</span>
            <FaTelegram className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default BuySignalsPanel;