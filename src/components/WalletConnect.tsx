import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FC } from 'react';

const WalletConnect: FC = () => {
  return (
    <ConnectButton 
      chainStatus="icon"
      showBalance={false}
    />
  );
};

export default WalletConnect; 