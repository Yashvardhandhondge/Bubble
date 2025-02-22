import React, { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useChainId, useSwitchChain } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { X, ChevronDown, ArrowDownUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { ChangellyService } from '../services/changelly';
import { ChangellyQuote, ChangellyToken } from '../types/changelly';

const SUPPORTED_CHAINS = [
  { id: 1, name: 'Ethereum', shortname: 'ETH' },
  { id: 10, name: 'Optimistic Ethereum', shortname: 'Optimism' },
  { id: 56, name: 'BNB Smart Chain', shortname: 'BSC' },
  { id: 137, name: 'Polygon', shortname: 'MATIC' },
  { id: 250, name: 'Fantom', shortname: 'FTM' },
  { id: 43114, name: 'Avalanche', shortname: 'AVAX' },
  { id: 42161, name: 'Arbitrum', shortname: 'Arbitrum' }
];

interface ChangellyDEXProps {
  onClose: () => void;
  className?: string;
}

export const ChangellyDEX: React.FC<ChangellyDEXProps> = ({ onClose, className = '' }) => {
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  const [selectedChain, setSelectedChain] = useState(SUPPORTED_CHAINS[0]);
  const [tokens, setTokens] = useState<ChangellyToken[]>([]);
  const [fromToken, setFromToken] = useState<ChangellyToken | null>(null);
  const [toToken, setToToken] = useState<ChangellyToken | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<ChangellyQuote | null>(null);
  const [showChainSelector, setShowChainSelector] = useState(false);
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

  // Fetch quote when inputs change
  useEffect(() => {
    if (!fromToken || !toToken || !amount || parseFloat(amount) <= 0) {
      setQuote(null);
      return;
    }

    const fetchQuote = async () => {
      try {
        setLoading(true);
        const amountInDecimals = parseUnits(amount, fromToken.decimals).toString();
        
        const quoteData = await ChangellyService.getQuote(
          selectedChain.id,
          fromToken.address,
          toToken.address,
          amountInDecimals
        );
        
        setQuote(quoteData);
      } catch (error) {
        console.error('Failed to get quote:', error);
        toast.error('Failed to get quote');
        setQuote(null);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchQuote, 500);
    return () => clearTimeout(timer);
  }, [fromToken, toToken, amount, selectedChain.id]);

  const handleSwap = async () => {
    if (!fromToken || !toToken || !amount || !address) {
      toast.error('Please fill all fields and connect wallet');
      return;
    }

    if (chainId !== selectedChain.id) {
      try {
        await switchChain({ chainId: selectedChain.id });
      } catch (error) {
        toast.error('Failed to switch network');
        return;
      }
    }

    try {
      setIsSwapping(true);
      const amountInDecimals = parseUnits(amount, fromToken.decimals).toString();
      
      const transaction = await ChangellyService.getSwapTransaction(
        selectedChain.id,
        fromToken.address,
        toToken.address,
        amountInDecimals,
        address
      );

      const { hash } = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: address,
          to: transaction.to,
          data: transaction.calldata,
          value: fromToken.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' ? amountInDecimals : '0x0',
          gasPrice: transaction.gas_price,
        }],
      });

      toast.success('Transaction submitted');
      
      // Wait for confirmation
      const receipt = await window.ethereum.request({
        method: 'eth_getTransactionReceipt',
        params: [hash],
      });

      if (receipt?.status === '0x1') {
        toast.success('Swap completed successfully!');
        onClose();
      } else {
        toast.error('Swap failed');
      }
    } catch (error) {
      console.error('Swap error:', error);
      toast.error('Failed to execute swap');
    } finally {
      setIsSwapping(false);
    }
  };

  const formatQuoteOutput = useCallback((quote: ChangellyQuote | null) => {
    if (!quote || !toToken) return '';
    try {
      return formatUnits(BigInt(quote.amount_out_total), toToken.decimals);
    } catch (error) {
      return quote.amount_out_total;
    }
  }, [toToken]);

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-white">Changelly DEX</h3>
            <div className="relative">
              <button
                onClick={() => setShowChainSelector(!showChainSelector)}
                className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-lg text-white text-sm"
              >
                {selectedChain.shortname}
                <ChevronDown size={16} />
              </button>
              
              {showChainSelector && (
                <div className="absolute top-full mt-1 w-48 bg-gray-700 rounded-lg shadow-lg z-10">
                  {SUPPORTED_CHAINS.map(chain => (
                    <button
                      key={chain.id}
                      onClick={() => {
                        setSelectedChain(chain);
                        setShowChainSelector(false);
                      }}
                      className="w-full text-left px-4 py-2 text-white hover:bg-gray-600 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {chain.name} ({chain.shortname})
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Swap Form */}
        <div className="space-y-4">
          {/* From Token */}
          <div className="space-y-2">
            <label className="text-white">From</label>
            <select 
              className="w-full bg-gray-700 text-white p-2 rounded"
              value={fromToken?.address || ''}
              onChange={(e) => setFromToken(tokens.find(t => t.address === e.target.value) || null)}
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
              className="w-full bg-gray-700 text-white p-2 rounded"
              placeholder="Enter amount"
              min="0"
            />
          </div>

          {/* Swap Direction Button */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                const temp = fromToken;
                setFromToken(toToken);
                setToToken(temp);
              }}
              className="p-2 bg-gray-700 rounded-full hover:bg-gray-600"
            >
              <ArrowDownUp size={20} className="text-white" />
            </button>
          </div>

          {/* To Token */}
          <div className="space-y-2">
            <label className="text-white">To</label>
            <select 
              className="w-full bg-gray-700 text-white p-2 rounded"
              value={toToken?.address || ''}
              onChange={(e) => setToToken(tokens.find(t => t.address === e.target.value) || null)}
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
            <div className="bg-gray-700 p-4 rounded-lg space-y-2">
              <p className="text-white">
                Estimated Output: {formatQuoteOutput(quote)} {toToken?.symbol}
              </p>
              <p className="text-gray-400">Gas: {quote.estimate_gas_total}</p>
              {quote.routes && (
                <p className="text-gray-400">Route: {quote.routes.protocol_name}</p>
              )}
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleSwap}
            disabled={loading || !quote || isSwapping || !address}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 hover:bg-blue-700"
          >
            {!address ? 'Connect Wallet' : isSwapping ? 'Swapping...' : 'Swap'}
          </button>


          {loading && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Wallet Status */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-700">
            <span className="text-white">Wallet:</span>
            <span className="text-gray-400">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}; 