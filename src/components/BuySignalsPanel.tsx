import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { Crown, User } from 'lucide-react';
import { FaTelegram } from 'react-icons/fa';
import { SignalData, SubscriptionStatus } from '../types';
import { FreeSignalCard } from './FreeSignalCard';
import { PremiumSignalCard } from './PremiumSignalCard';

export const BuySignalsPanel: React.FC = () => {
  const [signals, setSignals] = useState<SignalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    status: 'Free',
    cancelAtPeriodEnd: false,
    expiryDate: null,
    isActive: false
  });

  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const isPremiumActive =
    subscriptionStatus.status === 'Premium' && !subscriptionStatus.cancelAtPeriodEnd;

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

  const handleUpgradeToPremium = () => {
    window.open('https://pay.boomfi.xyz/2rwqC9PH4zXMNqTupAXjsNyNJ3v', '_blank');
  };

  const handleTelegramSupport = () => {
    window.open('https://t.me/yourtelegramchannel', '_blank');
  };

  return (
    <div className="h-full bg-black border-l border-gray-800/80 flex flex-col">
      <div className="flex items-center justify-between p-5 "> 
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
          <button onClick={openConnectModal} className="text-sm text-white">
            Connect Wallet
          </button>
        )}
      </div>

      <h2 className="text-2xl font-bold text-white p-4">Latest Buy Signals</h2>

      <div className="flex-1 overflow-y-auto px-4">
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

      <div className="p-4 border-t border-gray-800/50">
        {!isPremiumActive ? (
          <button
            onClick={handleUpgradeToPremium}
            className="w-full bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <span>Upgrade to Premium</span>
            <Crown className="w-4 h-4" />
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