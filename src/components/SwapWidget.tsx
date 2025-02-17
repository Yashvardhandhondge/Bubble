import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ChangellyService } from '../services/changelly';

export const SwapWidget = () => {
  const { address } = useAccount();
  const [fromToken, setFromToken] = useState('USDT');
  const [toToken, setToToken] = useState('ARB');
  const [amount, setAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<string[]>([]);

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      const availableTokens = await ChangellyService.getTokens();
      setTokens(availableTokens);
    } catch (error) {
      console.error('Failed to load tokens:', error);
    }
  };

  const handleSwap = async () => {
    if (!address || !amount) return;
    
    setLoading(true);
    try {
      const transaction = await ChangellyService.createTransaction(
        fromToken,
        toToken,
        amount,
        address
      );
      // Handle successful transaction
      console.log('Transaction created:', transaction);
    } catch (error) {
      console.error('Swap failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold text-white mb-4">Swap Tokens</h2>
      
      {/* Token Selection and Amount Inputs */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <select 
            value={fromToken}
            onChange={(e) => setFromToken(e.target.value)}
            className="bg-gray-700 text-white p-2 rounded"
          >
            {tokens.map(token => (
              <option key={token} value={token}>{token}</option>
            ))}
          </select>
          
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="bg-gray-700 text-white p-2 rounded flex-1"
          />
        </div>

        <div className="flex gap-4">
          <select
            value={toToken}
            onChange={(e) => setToToken(e.target.value)}
            className="bg-gray-700 text-white p-2 rounded"
          >
            {tokens.map(token => (
              <option key={token} value={token}>{token}</option>
            ))}
          </select>
          
          <div className="bg-gray-700 text-white p-2 rounded flex-1">
            {exchangeRate ? Number(amount) * exchangeRate : '0.00'}
          </div>
        </div>

        <button
          onClick={handleSwap}
          disabled={!address || !amount || loading}
          className="w-full bg-blue-600 text-white p-3 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Swap Now'}
        </button>
      </div>
    </div>
  );
};
