import { useState, useEffect } from 'react';
import { SubscriptionStatus } from '../types';

const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  SUBSCRIPTION: 'subscription_status',
  LAST_CHECK: 'last_check_time'
};

export const useSubscriptionCheck = (walletAddress: string | undefined) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION);
    return stored ? JSON.parse(stored) : {
      status: 'Free',
      cancelAtPeriodEnd: false,
      expiryDate: null,
      isActive: false
    };
  });

  const checkSubscription = async () => {
    if (!walletAddress) return;

    try {
      const response = await fetch('http://localhost:5000/api/auth/check-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem(STORAGE_KEYS.TOKEN)}`
        },
        body: JSON.stringify({ walletAddress })
      });

      const data = await response.json();

      if (data.success) {
        const newStatus: SubscriptionStatus = {
          status: data.user.subscription.status,
          cancelAtPeriodEnd: data.user.subscription.cancelAtPeriodEnd,
          expiryDate: data.user.subscription.expiryDate,
          isActive: !data.user.subscription.cancelAtPeriodEnd
        };

        // Only update if status has changed
        if (JSON.stringify(newStatus) !== localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION)) {
          setSubscriptionStatus(newStatus);
          localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(newStatus));
        }

        localStorage.setItem(STORAGE_KEYS.LAST_CHECK, Date.now().toString());
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  useEffect(() => {
    if (!walletAddress) return;

    
    checkSubscription();

    
    const interval = setInterval(checkSubscription, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [walletAddress]);

  return subscriptionStatus;
};
