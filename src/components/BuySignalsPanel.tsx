import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { 
  Crown,
  ChevronUp,
  ChevronRight,
  CheckCircle,
  XCircle,
  Lock, 
  User
} from 'lucide-react';
import { FaTelegram } from 'react-icons/fa';
import axios from 'axios';

// Type definitions
interface SignalData {
  description: string;
  risks: string[];
  symbol: string;
  timestamp?: number;
}

interface SubscriptionResponse {
  message: string;
  token: string;
  user: {
    subscription: {
      status: 'Free' | 'Premium';
      cancelAtPeriodEnd: boolean;
      expiryDate?: string | null;
    };
    walletAddress: string;
  };
}

// Helper functions
const extractPrice = (description: string): string => {
  const priceMatch = description.match(/\$(\d+(?:\.\d+)?)/);
  return priceMatch ? priceMatch[1] : '0';
};

const extractPercentages = (description: string): string[] => {
  const percentages = description.match(/-?\d+\.\d+%/g);
  return percentages || [];
};

export const BuySignalsPanel: React.FC = () => {
  // State management
  const [signals, setSignals] = useState<SignalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    status: 'Free' | 'Premium';
    cancelAtPeriodEnd: boolean;
    expiryDate?: string | null;
  }>({
    status: 'Free', 
    cancelAtPeriodEnd: false,
    expiryDate: null
  });
  
  // Hooks and navigation
  const navigate = useNavigate();
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();

  // Fetch signals effect
  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const response = await fetch('http://3.75.231.25/dex_signals');
        const data = await response.json();
        
        // Sort signals by timestamp if available
        const sortedSignals = data.sort((a: SignalData, b: SignalData) => 
          (b.timestamp || 0) - (a.timestamp || 0)
        );
        
        setSignals(sortedSignals);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching signals:', error);
        setLoading(false);
      }
    };

    fetchSignals();
    const interval = setInterval(fetchSignals, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Wallet connection and registration effect
  useEffect(() => {
    const registerWallet = async (walletAddress: string) => {
      try {
        const response = await axios.post<SubscriptionResponse>(
          'http://localhost:5000/api/auth/register', 
          { walletAddress }
        );
        
        // Store authentication token
        localStorage.setItem('token', response.data.token);
        
        // Update subscription status
        const { status, cancelAtPeriodEnd, expiryDate } = response.data.user.subscription;
        setSubscriptionStatus({ 
          status, 
          cancelAtPeriodEnd,
          expiryDate
        });
        
        console.log('Registration successful:', response.data);
      } catch (error) {
        console.error('Registration error:', error);
        // Fallback to free tier if registration fails
        setSubscriptionStatus({ 
          status: 'Free', 
          cancelAtPeriodEnd: false,
          expiryDate: null 
        });
      }
    };

    if (address) {
      registerWallet(address);
    }
  }, [address]);

  // Computed properties
  const isPremiumActive = useMemo(() => {
    return subscriptionStatus.status === 'Premium' && 
           !subscriptionStatus.cancelAtPeriodEnd;
  }, [subscriptionStatus]);

  // Handlers
  const handleUpgradeToPremium = () => {
    window.open('https://pay.boomfi.xyz/2rwqC9PH4zXMNqTupAXjsNyNJ3v', '_blank');
  };

  const handleTelegramSupport = () => {
    window.open('https://t.me/yourtelegramchannel', '_blank');
  };

  return (
    <div className="h-full bg-black border-l border-gray-800/80 flex flex-col">
      {/* Subscription Status Header */}
      <div className="flex items-center justify-between p-4 bg-[#19202F]">
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

        {/* Wallet Connection */}
        {address ? (
          <button 
            onClick={() => console.log('Wallet address:', address)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1B61B3] rounded-full"
          >
            <div className="w-3 h-3 bg-purple-500 rounded-full" />
            <span className="text-xs text-[#DDDDDD]">
              {`${address.slice(0, 6)}...${address.slice(-4)}`}
            </span>
          </button>
        ) : (
          <button 
            onClick={openConnectModal} 
            className="text-sm text-white"
          >
            Connect Wallet
          </button>
        )}
      </div>

      {/* Signals Header */}
      <h2 className="text-2xl font-bold text-white p-4">
        Latest Buy Signals
      </h2>

      {/* Signals Container */}
      <div className="flex-1 overflow-y-auto px-4">
        {loading ? (
          <div className="text-white text-center mt-8">
            Loading signals...
          </div>
        ) : signals.length > 0 ? (
          <div className="space-y-4">
            {signals.map((signal, index) => (
              <div
                key={index}
                className={`relative p-4 rounded-xl ${
                  !isPremiumActive 
                    ? 'bg-gray-800/50 border border-gray-700' 
                    : 'bg-[#103118]/50 border border-[#05621C]'
                }`}
              >
                {/* Blur overlay for non-premium users */}
                {!isPremiumActive && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Lock className="w-12 h-12 text-white opacity-70" />
                    <span className="ml-4 text-white">Upgrade to view</span>
                  </div>
                )}

                <div className="flex justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl font-semibold text-white">
                        ${signal.symbol}
                      </span>
                    </div>
                    <span className="text-xl font-bold text-white">
                      ${extractPrice(signal.description)}
                    </span>
                  </div>
                  
                  {/* Expand/Collapse Signal Details */}
                  <button 
                    onClick={() => 
                      setExpandedSignal(
                        expandedSignal === signal.symbol ? null : signal.symbol
                      )
                    }
                    disabled={!isPremiumActive}
                  >
                    {expandedSignal === signal.symbol ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Expanded Signal Details */}
                {isPremiumActive && expandedSignal === signal.symbol && (
                  <>
                    <div className="mt-4">
                      <div className="flex items-center gap-2 text-emerald-500 mb-2">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">Performance:</span>
                      </div>
                      {extractPercentages(signal.description).map((percentage, i) => (
                        <div 
                          key={i} 
                          className={`text-sm ml-6 mb-1 ${
                            percentage.startsWith('-') 
                              ? 'text-red-400' 
                              : 'text-green-400'
                          }`}
                        >
                          {percentage}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center gap-2 text-rose-500 mb-2">
                        <XCircle className="w-4 h-4" />
                        <span className="font-medium">Risks:</span>
                      </div>
                      {signal.risks.map((risk, i) => (
                        <div 
                          key={i} 
                          className="text-gray-400 text-sm ml-6 mb-1"
                        >
                          {risk}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-white text-center mt-8">
            No signals available
          </div>
        )}
      </div>

      {/* Upgrade/Support Button */}
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