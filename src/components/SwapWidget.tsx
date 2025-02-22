import React, { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useChainId, useSwitchChain } from 'wagmi';
import { parseUnits } from 'viem';
import { ArrowDownUp, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ChangellyService } from '../services/changelly';
import type { ChangellyToken, ChangellyQuote } from '../types/changelly';

const SUPPORTED_CHAINS = [
  { id: 1, name: 'Ethereum', shortname: 'ETH' },
  { id: 10, name: 'Optimistic Ethereum', shortname: 'Optimism' },
  { id: 56, name: 'BNB Smart Chain', shortname: 'BSC' },
  { id: 137, name: 'Polygon', shortname: 'MATIC' },
  { id: 250, name: 'Fantom', shortname: 'FTM' },
  { id: 43114, name: 'Avalanche', shortname: 'AVAX' },
  { id: 42161, name: 'Arbitrum', shortname: 'Arbitrum' }
];

interface SwapWidgetProps {
  onClose?: () => void;
  className?: string;
}

export const SwapWidget: React.FC<SwapWidgetProps> = ({ onClose, className = '' }) => {
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [selectedChain, setSelectedChain] = useState(SUPPORTED_CHAINS[0]);
  const [tokens, setTokens] = useState<ChangellyToken[]>([]);
  const [fromToken, setFromToken] = useState<ChangellyToken | null>(null);
  const [toToken, setToToken] = useState<ChangellyToken | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<ChangellyQuote | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);

  // Load tokens when chain changes
  useEffect(() => {
    const loadTokens = async () => {
      try {
        setLoading(true);
        const tokenList = await ChangellyService.getTokens(selectedChain.id);
        setTokens(tokenList);
        setFromToken(null);
        setToToken(null);
        setQuote(null);
      } catch (error) {
        console.error('Failed to load tokens:', error);
        toast.error('Failed to load tokens');
      } finally {
        setLoading(false);
      }
    };

    loadTokens();
  }, [selectedChain.id]);

  // Get quote when inputs change
  useEffect(() => {
    const getQuote = async () => {
      if (!fromToken || !toToken || !amount || parseFloat(amount) <= 0) {
        setQuote(null);
        return;
      }

      try {
        setLoading(true);
        const amountInWei = parseUnits(amount, fromToken.decimals).toString();
        const quoteData = await ChangellyService.getQuote(
          selectedChain.id,
          fromToken.address,
          toToken.address,
          amountInWei
        );
        setQuote(quoteData);
      } catch (error) {
        console.error('Failed to get quote:', error);
        toast.error('Failed to get quote');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(getQuote, 500);
    return () => clearTimeout(timer);
  }, [fromToken, toToken, amount, selectedChain.id]);

  const handleNetworkSwitch = useCallback(async (targetChainId: number) => {
    try {
      await switchChain({ chainId: targetChainId });
    } catch (error) {
      console.error('Network switch error:', error);
      toast.error('Failed to switch network');
    }
  }, [switchChain]);

  const handleSwap = async () => {
    if (!address || !fromToken || !toToken || !amount || !quote) {
      toast.error('Please fill all fields');
      return;
    }

    if (chainId !== selectedChain.id) {
      try {
        await handleNetworkSwitch(selectedChain.id);
      } catch (error) {
        return;
      }
    }

    try {
      setIsSwapping(true);
      
      // Check allowance first
      const allowance = await ChangellyService.checkAllowance(
        selectedChain.id,
        fromToken.address,
        address
      );

      const amountInWei = parseUnits(amount, fromToken.decimals).toString();

      // If allowance is insufficient, get approval transaction
      if (BigInt(allowance.remaining) < BigInt(amountInWei)) {
        const approvalTx = await ChangellyService.getApproveTransaction(
          selectedChain.id,
          fromToken.address,
          amountInWei
        );

        toast.loading('Approving token...', { id: 'approval' });

        // Send approval transaction
        const approveTxHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: address,
            to: approvalTx.to,
            data: approvalTx.calldata,
            gasPrice: approvalTx.gas_price
          }]
        });

        // Wait for approval confirmation
        const approvalReceipt = await window.ethereum.request({
          method: 'eth_getTransactionReceipt',
          params: [approveTxHash]
        });

        if (approvalReceipt?.status !== '0x1') {
          throw new Error('Token approval failed');
        }

        toast.success('Token approved', { id: 'approval' });
      }

      // Get swap transaction
      toast.loading('Preparing swap...', { id: 'swap' });
      const swapTx = await ChangellyService.getSwapTransaction(
        selectedChain.id,
        fromToken.address,
        toToken.address,
        amountInWei,
        address
      );

      // Send swap transaction
      const swapTxHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: address,
          to: swapTx.to,
          data: swapTx.calldata,
          gasPrice: swapTx.gas_price,
          value: swapTx.value || '0x0'
        }]
      });

      toast.loading('Swap in progress...', { id: 'swap' });

      // Wait for swap confirmation
      const receipt = await window.ethereum.request({
        method: 'eth_getTransactionReceipt',
        params: [swapTxHash]
      });

      if (receipt?.status === '0x1') {
        toast.success('Swap completed successfully', { id: 'swap' });
        // Reset form
        setAmount('');
        setQuote(null);
        if (onClose) onClose();
      } else {
        toast.error('Swap failed', { id: 'swap' });
      }

    } catch (error) {
      console.error('Swap failed:', error);
      toast.error('Failed to execute swap', { id: 'swap' });
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className={`p-6 bg-gray-800 rounded-lg shadow-xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Swap Tokens</h2>
        <div className="flex items-center gap-4">
          <select
            value={selectedChain.id}
            onChange={(e) => {
              const chain = SUPPORTED_CHAINS.find(c => c.id === Number(e.target.value));
              if (chain) setSelectedChain(chain);
            }}
            className="bg-gray-700 text-white p-2 rounded"
          >
            {SUPPORTED_CHAINS.map(chain => (
              <option key={chain.id} value={chain.id}>
                {chain.name}
              </option>
            ))}
          </select>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* From Token */}
        <div className="space-y-2">
          <label className="text-white">From</label>
          <div className="flex gap-4">
            <select
              value={fromToken?.address || ''}
              onChange={(e) => {
                const token = tokens.find(t => t.address === e.target.value);
                setFromToken(token || null);
              }}
              className="bg-gray-700 text-white p-2 rounded flex-1"
              disabled={loading}
            >
              <option value="">Select token</option>
              {tokens.map(token => (
                <option key={token.address} value={token.address}>
                  {token.symbol} - {token.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="bg-gray-700 text-white p-2 rounded flex-1"
              disabled={loading || !fromToken}
            />
          </div>
        </div>

        {/* Swap Direction Button */}
        <div className="flex justify-center">
          <button
            onClick={() => {
              const temp = fromToken;
              setFromToken(toToken);
              setToToken(temp);
            }}
            className="p-2 bg-gray-700 rounded-full hover:bg-gray-600 disabled:opacity-50"
            disabled={loading || !fromToken || !toToken}
          >
            <ArrowDownUp className="text-white" />
          </button>
        </div>

        {/* To Token */}
        <div className="space-y-2">
          <label className="text-white">To</label>
          <select
            value={toToken?.address || ''}
            onChange={(e) => {
              const token = tokens.find(t => t.address === e.target.value);
              setToToken(token || null);
            }}
            className="bg-gray-700 text-white p-2 rounded w-full"
            disabled={loading}
          >
            <option value="">Select token</option>
            {tokens.map(token => (
              <option key={token.address} value={token.address}>
                {token.symbol} - {token.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quote Display */}
        {quote && (
          <div className="bg-gray-700 p-4 rounded space-y-2">
            <p className="text-white">
              Estimated Output: {quote.amount_out_total}
            </p>
            <p className="text-gray-400">
              Route: {quote.routes.protocol_name}
            </p>
            <p className="text-gray-400">
              Gas Estimate: {quote.estimate_gas_total}
            </p>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={loading || isSwapping || !quote || !address}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          {!address ? 'Connect Wallet' : 
           isSwapping ? 'Swapping...' :
           loading ? 'Loading...' : 'Swap'}
        </button>

        {/* Connection Status */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-700">
          <span className="text-gray-400">Wallet:</span>
          <span className="text-white">
            {address ? 
              `${address.slice(0, 6)}...${address.slice(-4)}` : 
              'Not connected'
            }
          </span>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};