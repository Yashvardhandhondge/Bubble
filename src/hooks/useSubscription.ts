import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useSubscriptionCheck } from './useSubscriptionCheck';
import { AuthService } from '../services/api';

export const useSubscription = () => {
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { address } = useAccount();
  const subscriptionStatus = useSubscriptionCheck(address);
  
  const isPremiumActive = subscriptionStatus ? !subscriptionStatus.cancelAtPeriodEnd : false;

  const handleWalletConnect = async (walletAddr: string) => {
    try {
      setConnectionError(null);
      const result = await AuthService.register(walletAddr);
      if (!result.success) {
        setConnectionError(result.error);
        console.error('Connection failed:', result.error);
      }
    } catch (error) {
      setConnectionError('Failed to connect wallet');
      console.error('Error connecting wallet:', error);
    }
  };

  const handleUpgradeToPremium = () => {
    window.open('https://pay.boomfi.xyz/2rwqC9PH4zXMNqTupAXjsNyNJ3v', '_blank');
  };

  const handleTelegramSupport = () => {
    window.open('https://t.me/+1oKOrFd0G2RjYjVk', '_blank');
  };

  useEffect(() => {
    if (address) {
      handleWalletConnect(address);
    }
  }, [address]);

  return {
    isPremiumActive,
    connectionError,
    handleUpgradeToPremium,
    handleTelegramSupport,
    address
  };
};
