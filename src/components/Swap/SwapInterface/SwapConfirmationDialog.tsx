

import React from 'react';
import { Token } from '../../../types/api';

interface SwapConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fromToken?: Token;
  toToken?: Token;
  fromAmount: string;
  toAmount: string;
  receiverAddress: string;
}

export const SwapConfirmationDialog: React.FC<SwapConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  fromToken,
  toToken,
  fromAmount,
  toAmount,
  receiverAddress
}) => {
  if (!isOpen || !fromToken || !toToken) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">Confirm Swap</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <img
                src={fromToken.logoURI}
                  alt={fromToken.symbol}
                  className="w-8 h-8 rounded-full"
              
                />
                <div>
                  <div className="font-medium">{fromAmount}</div>
                  <div className="text-sm text-gray-500">{fromToken.symbol}</div>
                </div>
              </div>

              <div className="flex justify-center my-2">↓</div>

              <div className="flex items-center gap-3">
                <img
                  alt={toToken.symbol}
                  className="w-8 h-8 rounded-full"
                 src={toToken.logoURI}
                />
                <div>
                  <div className="font-medium">{toAmount}</div>
                  <div className="text-sm text-gray-500">{toToken.symbol}</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Rate</span>
                <span>1 {fromToken.symbol} = {(Number(toAmount) / Number(fromAmount)).toFixed(6)} {toToken.symbol}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Minimum received</span>
                <span>{(Number(toAmount) * 0.995).toFixed(6)} {toToken.symbol}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Network Fee</span>
                <span>~$0.50</span>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              Output is estimated. You will receive at least {(Number(toAmount) * 0.995).toFixed(6)} {toToken.symbol} or the transaction will revert.
            </div>

            <button
              onClick={onConfirm}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Confirm Swap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};