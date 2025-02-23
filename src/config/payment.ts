import { http, createConfig } from 'wagmi';
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
import { createPublicClient, fallback, http as viemHttp } from 'viem';

const projectId = 'bfd7872dd9235ed6ec86f95411b7d584';

const chains = [
  mainnet,
  optimism,
  polygon,
  arbitrum,
  avalanche,
  fantom,
  bsc
] as const;

// Explicitly declare transports with proper types
const transports = {
  [mainnet.id]: http(),
  [optimism.id]: http(),
  [polygon.id]: http(),
  [arbitrum.id]: http(),
  [avalanche.id]: http(),
  [fantom.id]: http(),
  [bsc.id]: http()
} as const;

export const config = getDefaultConfig({
  appName: 'CoinChartFun',
  projectId,
  chains,
  transports,
  ssr: true
});

export { chains };