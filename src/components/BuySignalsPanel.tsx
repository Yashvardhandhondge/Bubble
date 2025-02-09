import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { Crown, User } from 'lucide-react';
import { FaTelegram } from 'react-icons/fa';
import { SignalData } from '../types';
import { FreeSignalCard } from './FreeSignalCard';
import { PremiumSignalCard } from './PremiumSignalCard';
import { useSubscriptionCheck } from '../hooks/useSubscriptionCheck';
import Buttons from './Buttons';
import { AuthService } from '../services/api';

export const BuySignalsPanel: React.FC = () => {
  const [signals, setSignals] = useState<SignalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const subscriptionStatus = useSubscriptionCheck(address);
  
  const isPremiumActive = !subscriptionStatus.cancelAtPeriodEnd;


  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const response = await fetch('https://api.coinchart.fun/dex_signals');
        const data = await response.json();
        const sortedSignals = data.sort(
          (a: SignalData, b: SignalData) => (b.timestamp || 0) - (a.timestamp || 0)
        );
        setSignals(sortedSignals);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching signals:', error);
        setLoading(false);
      }
    };

    fetchSignals();
    const interval = setInterval(fetchSignals, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (address) {
      handleWalletConnect(address);
    }
  }, [address]);

  const handleUpgradeToPremium = () => {
    window.open('https://pay.boomfi.xyz/2rwqC9PH4zXMNqTupAXjsNyNJ3v', '_blank');
  };

  const handleTelegramSupport = () => {
    window.open('https://t.me/+1oKOrFd0G2RjYjVk', '_blank');
  };

  const handleWalletConnect = async (walletAddr: string) => {
    try {
      setConnectionError(null);
      const result = await AuthService.register(walletAddr);
      if (result.success) {
        console.log('Wallet connected:', result.data.user);
      } else {
        setConnectionError(result.error);
        console.error('Connection failed:', result.error);
      }
    } catch (error) {
      setConnectionError('Failed to connect wallet');
      console.error('Error connecting wallet:', error);
    }
  };

  return (
    <div className="h-full bg-black flex flex-col">
   
      <div className="flex flex-col lg:flex-row items-center justify-between p-4 h-16 "> 
  
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
      
  
      <div className="px-4 py-2">
 <h1 className='text-2xl p-7 text-white font-semibold '>Latest Buy Signals </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {loading ? (
          <div className="text-white text-center mt-8">Loading signals...</div>
        ) : signals.length > 0 ? (
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

      {connectionError && (
        <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {connectionError}
        </div>
      )}

      <div className="p-2 border-t border-gray-800/50">
        {!isPremiumActive ? (
          <button
            onClick={handleUpgradeToPremium}
            className="w-full h-full p-4"
          >

<Buttons/>
          </button>
        ) : (
          <button
            onClick={handleTelegramSupport}
            className="w-full bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
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