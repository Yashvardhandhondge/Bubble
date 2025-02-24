
import React from 'react';
import { useSwitchChain, useAccount } from 'wagmi';
import { useConfig } from 'wagmi';

export const ChainSelector: React.FC = () => {
  const { chains } = useConfig();
  const { chain: activeChain } = useAccount();
  const { switchChain } = useSwitchChain();

  return (
    <div className="relative">
      <select
        value={activeChain?.id || ''}
        onChange={(e) => switchChain({ chainId: Number(e.target.value) })}
        className="w-full px-4 py-2 bg-white border rounded-lg shadow-sm cursor-pointer hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="" disabled>Select Network</option>
        {chains.map((chain) => (
          <option key={chain.id} value={chain.id}>
            {chain.name}
          </option>
        ))}
      </select>
      
      {activeChain && (
        <div className="flex items-center mt-2 text-sm text-gray-600">
          <div className="w-2 h-2 mr-2 rounded-full bg-green-500"></div>
          Connected to {activeChain.name}
        </div>
      )}
    </div>
  );
};