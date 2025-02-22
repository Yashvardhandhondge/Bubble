import React from 'react';
import { ChangellyToken } from '../types/changelly';

interface TokenSelectorProps {
  onSelect: (token: ChangellyToken) => void;
  selectedToken: ChangellyToken | null;
  label: string;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({ onSelect, selectedToken, label }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-white mb-4">{label}</h3>
      {/* Token selection UI will go here */}
    </div>
  );
};

export default TokenSelector; 