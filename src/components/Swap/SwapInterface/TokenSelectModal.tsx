
import React, { useState, useEffect } from 'react';

import { Token } from '../../../types/api';
import { useTokenList } from '../../../hooks/useTokenList';
interface TokenSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  chainId: number;
  tokens: Token[] | Record<string, Token>;
}

export const TokenSelectModal: React.FC<TokenSelectModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  chainId,
  tokens
}) => {
  const { loading, error, fetchTokens } = useTokenList(chainId);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchTokens();
    }
  }, [isOpen, chainId, fetchTokens]);

  const tokensArray: Token[] = Array.isArray(tokens) ? tokens : Object.values(tokens);

  const filteredTokens = tokensArray.filter(token => 
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.address.toLowerCase() === searchQuery.toLowerCase()
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Select Token</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              ✕
            </button>
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by name or paste address"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {loading ? (
            <div className="text-center py-4">Loading tokens...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-4">{error}</div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {filteredTokens.map(token => (
                <button
                  key={token.address}
                  onClick={() => {
                    onSelect(token);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg"
                >
                  <img
                    alt={token.symbol}
                    className="w-8 h-8 rounded-full bg-gray-100"
                    src={token.logoURI}
                  />
                  <div className="flex flex-col items-start flex-1">
                    <span className="font-medium">{token.symbol}</span>
                    <span className="text-sm text-gray-500">{token.name}</span>
                  </div>
                  {/* Can add balance here if available */}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
