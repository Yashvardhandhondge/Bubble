import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAccount } from 'wagmi';

const PaymentVerification: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { address } = useAccount();

  useEffect(() => {
    const verifyPayment = async () => {
      const params = new URLSearchParams(location.search);
      const pid = params.get('pid');

      if (!pid) return;

      try {
        const token = localStorage.getItem('auth_token');
        if (!token || !address) {
          throw new Error('Authentication required');
        }

        const response = await fetch(`https://api.coinchart.fun/api/auth/verify-subscription/${pid}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ walletAddress: address }),
        });

        const data = await response.json();
        
        if (data.success) {
          toast.success('Thanks for purchasing premium!');
          localStorage.setItem('premium_status', 'active');
          navigate('/', { replace: true });
        } else {
          throw new Error(data.message || 'Verification failed');
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to verify payment');
        navigate('/', { replace: true });
      }
    };

    verifyPayment();
  }, [location, address, navigate]);

  return null;
};

export default PaymentVerification;
