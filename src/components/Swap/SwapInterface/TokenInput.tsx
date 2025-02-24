import React from 'react';
import { Token } from '../../../types/api';

interface TokenInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelectToken: () => void;
  selectedToken?: Token;
  readOnly?: boolean;
  balance?: string;
  onMaxClick?: () => void;
}

export const TokenInput: React.FC<TokenInputProps> = ({
  label,
  value,
  onChange,
  onSelectToken,
  selectedToken,
  readOnly = false,
  balance,
  onMaxClick
}) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {balance && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Balance: {balance}</span>
            {onMaxClick && (
              <button
                onClick={onMaxClick}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                MAX
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onSelectToken}
          className="flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50"
        >
          {selectedToken ? (
            <>
              <img 
                alt={selectedToken.symbol}
                className="w-6 h-6 rounded-full"
               src={selectedToken.logoURI}
              />
              <span className="font-medium">{selectedToken.symbol}</span>
            </>
          ) : (
            <span>Select Token</span>
          )}
        </button>
        <div className="flex-1 relative">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              // Only allow numbers and one decimal point
              const val = e.target.value;
              if (/^\d*\.?\d*$/.test(val)) {
                onChange(val);
              }
            }}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="0.0"
            readOnly={readOnly}
          />
        </div>
      </div>
    </div>
  );
};
