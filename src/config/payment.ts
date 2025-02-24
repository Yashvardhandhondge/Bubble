// src/config/wallet.ts
import { http } from 'wagmi'
import {
  mainnet,
  optimism,
  polygon,
  arbitrum,
  avalanche,
  fantom,
  bsc
} from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { QueryClient } from '@tanstack/react-query'

export const chains = [
  mainnet,
  optimism,
  polygon,
  arbitrum,
  avalanche,
  fantom,
  bsc
] as const;

// Configure transports for each chain
const transports = Object.fromEntries(
  chains.map(chain => [chain.id, http()])
) as Record<number, ReturnType<typeof http>>;

export const config = getDefaultConfig({
  appName: 'Swap DApp',
  projectId: "bfd7872dd9235ed6ec86f95411b7d584",
  chains,
  transports,
  ssr: true
});

// Create Query Client
export const queryClient = new QueryClient();