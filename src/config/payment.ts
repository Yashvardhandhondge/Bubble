import { http } from 'viem';
import { createConfig } from 'wagmi';
import {
  mainnet,
  optimism,
  polygon,
  arbitrum,
  avalanche,
  fantom,
  bsc
} from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

const projectId = 'bfd7872dd9235ed6ec86f95411b7d584';
const chains = [mainnet, optimism, polygon, arbitrum, avalanche, fantom, bsc] as const;

// Use getDefaultConfig to setup wallets and providers in one step.
export const config = getDefaultConfig({
  appName: 'CoinChartFun',
  projectId,
  chains,
  transports: {
    [mainnet.id]: http(),
    [optimism.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [avalanche.id]: http(),
    [fantom.id]: http(),
    [bsc.id]: http(),
  },
});

export { chains };