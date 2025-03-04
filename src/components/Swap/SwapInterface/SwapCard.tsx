import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { TokenInput } from './TokenInput';
import { TokenSelectModal } from './TokenSelectModal';
import { ChainSelector } from '../ChainSelector/ChainSelector';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

import { useTokenList } from '../../../hooks/useTokenList';
import { SwapConfirmationDialog } from './SwapConfirmationDialog';
import { Token } from '../../../types/api';
import { useSwapExecution } from '../../../hooks/useSwapExecution';
import { useSwap } from '../../../hooks/useSwap';

// Add a new component for token approval
const TokenApprovalCard = ({ 
  tokenSymbol, 
  onApprove, 
  onCancel,
  isApproving 
}:any) => (
  <div className="p-4 bg-yellow-50 border border-yellow-400 rounded-lg mb-4">
    <h3 className="font-bold text-yellow-800">Token Approval Required</h3>
    <p className="my-2 text-yellow-700">
      To swap {tokenSymbol}, you need to approve the DEX to use your tokens.
    </p>
    <div className="flex justify-between mt-4">
      <button
        onClick={onCancel}
        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
      >
        Cancel
      </button>
      <button
        onClick={onApprove}
        disabled={isApproving}
        className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-yellow-300"
      >
        {isApproving ? 'Approving...' : `Approve ${tokenSymbol}`}
      </button>
    </div>
  </div>
);

export const SwapCard: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { address, isConnected, chain } = useAccount();
  const [selectingToken, setSelectingToken] = useState<'from' | 'to' | null>(null);
  
  const {
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    slippage,
    loading: priceLoading,
    error: priceError,
    priceGraphData,
    setFromToken,
    setToToken,
    setFromAmount,
    setSlippage,
    fetchBalances
  } = useSwap();

  const {
    isApproving,
    needsApproval,
    error: swapError,
    executeSwap,
    approveToken
  } = useSwapExecution();

  const [approvalData, setApprovalData] = useState<{
    tokenAddress: string;
    spenderAddress: string;
    amount: string;
    chainId: number;
    tokenSymbol: string;
  } | null>(null);

  const [userBalances, setUserBalances] = useState<Record<string, string>>({});

  // Fetch tokens using the hook for the current chain
  const { tokens, loading: tokenLoading, error: tokenError, fetchTokens } = useTokenList(chain?.id);

  // Fetch balances when account or tokens change
  useEffect(() => {
    if (isConnected && address) {
      fetchBalances().then(balances => setUserBalances(balances || {}));
    }
  }, [isConnected, address, fromToken, toToken]);

  // Fetch tokens when modal opens or chain changes
  useEffect(() => {
    if (chain?.id) {
      fetchTokens();
    }
  }, [chain?.id, fetchTokens]);

  // Reset tokens when chain changes
  useEffect(() => {
    setFromToken(undefined);
    setToToken(undefined);
    setFromAmount('');
  }, [chain?.id]);

  const handleTokenSelect = (token: Token) => {
    if (selectingToken === 'from') {
      if (toToken?.address === token.address) {
        setToToken(fromToken);
      }
      setFromToken(token);
    } else {
      if (fromToken?.address === token.address) {
        setFromToken(toToken);
      }
      setToToken(token);
    }
    setSelectingToken(null);
  };

  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSwapClick = () => {
    setShowConfirmation(true);
  };

  // Add function to handle manual token approval
  const handleApproveToken = async () => {
    if (!approvalData) return;
    
    try {
      const { tokenAddress, spenderAddress, amount, chainId } = approvalData;
      const approved = await approveToken(chainId, tokenAddress, spenderAddress, amount);
      
      if (approved) {
        // If approval was successful, try the swap again
        handleSwap();
      }
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  // Add function to cancel approval
  const handleCancelApproval = () => {
    // Reset the approval state
    setShowConfirmation(false);
  };

  // Update handleSwap to handle the approval flow
  const handleSwap = async () => {
    if (!fromToken || !toToken || !fromAmount || !isConnected || !chain || !address) return;
    
    setShowConfirmation(false);
    
    try {
      const hash = await executeSwap(
        chain.id,
        fromToken,
        toToken,
        fromAmount,
        slippage
      );

      if (hash) {
        // Transaction was successful
        toast.success("Swap completed successfully!");
        await fetchBalances().then(balances => setUserBalances(balances || {}));
      }
      // No else here - if needsApproval is set, it will be handled by the UI
    } catch (err) {
      console.error('Swap failed:', err);
      toast.error("Swap failed. Please try again.");
    }
  };

  const switchTokens = () => {
    if (fromToken && toToken) {
      setFromToken(toToken);
      setToToken(fromToken);
      setFromAmount(toAmount);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
          <p className="text-gray-600 mb-6">Please connect your wallet to start swapping tokens</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="max-w-md w-full mx-auto p-6 bg-white rounded-xl shadow-lg relative">
        {/* Add close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        
        {/* Existing content */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Swap Tokens</h2>
          <ChainSelector />
        </div>

        {/* Show approval card if approval is needed */}
        {needsApproval && approvalData && (
          <TokenApprovalCard
            tokenSymbol={approvalData.tokenSymbol}
            onApprove={handleApproveToken}
            onCancel={handleCancelApproval}
            isApproving={isApproving}
          />
        )}

        {chain ? (
          <>
            <TokenInput
              label="You Pay"
              value={fromAmount}
              onChange={setFromAmount}
              onSelectToken={() => setSelectingToken('from')}
              selectedToken={fromToken}
              balance={fromToken ? (userBalances[fromToken.address] || '0') : undefined}
            />

            <div className="my-4 flex justify-center">
              <button 
                onClick={switchTokens}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
              >
                ↓↑
              </button>
            </div>

            <TokenInput
              label="You Receive"
              value={toAmount}
              onChange={() => {}} // Read-only
              onSelectToken={() => setSelectingToken('to')}
              selectedToken={toToken}
              balance={toToken ? userBalances[toToken.address] : undefined}
              readOnly
            />

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slippage Tolerance
                </label>
                <select
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="0.5">0.5%</option>
                  <option value="1.0">1.0%</option>
                  <option value="2.0">2.0%</option>
                </select>
              </div>

              {fromToken && toToken && fromAmount && toAmount && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Rate</span>
                    <span>
                      1 {fromToken.symbol} = {
                        (Number(toAmount) / Number(fromAmount)).toFixed(6)
                      } {toToken.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network Fee</span>
                    <span>~ $0.50</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleSwapClick}
                disabled={!fromToken || !toToken || !fromAmount || priceLoading || isApproving}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg 
                         disabled:bg-gray-400 hover:bg-blue-700"
              >
                {isApproving
                  ? 'Approving...'
                  : priceLoading
                    ? 'Loading...'
                    : !fromToken || !toToken 
                      ? 'Select Tokens'
                      : !fromAmount 
                        ? 'Enter Amount'
                        : 'Swap'}
              </button>

              {(priceError || swapError) && (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg">
                  {priceError || swapError}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-600">
            Please select a network to start swapping
          </div>
        )}

        {selectingToken && chain && (
          <TokenSelectModal
            isOpen={true}
            onClose={() => setSelectingToken(null)}
            onSelect={handleTokenSelect}
            chainId={chain.id}
            tokens={tokens} // Pass the tokens received from the hook
          />
        )}

        {showConfirmation && (
          <SwapConfirmationDialog
            isOpen={true}
            onClose={() => setShowConfirmation(false)}
            onConfirm={handleSwap}
            fromToken={fromToken}
            toToken={toToken}
            fromAmount={fromAmount}
            toAmount={toAmount}
            receiverAddress={address || ''}
          />
        )}
      </div>
    </div>
  );
};