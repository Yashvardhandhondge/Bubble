// src/services/api.ts
import axios from 'axios';
import { Token } from '../types/api';


const API_BASE_URL = 'https://api.coinchart.fun';
const API_KEY = "57d18ecb-7f0e-456c-a085-2d43ec6e2b3f";
const DEFAULT_GAS_PRICE = '3500000000'; 

// Create a separate instance for Changelly requests
const changellyApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
    'X-Api-Key': API_KEY,
  },
});

// Simple request logger (no auth)
changellyApi.interceptors.request.use((config) => {
  console.log('Outgoing Changelly request to:', config.url);
  return config;
});

// Response interceptor
changellyApi.interceptors.response.use(
  (response) => {
    console.log('Incoming Changelly response from:', response.config.url);
    return response;
  },
  (error) => {
    console.error('Error in Changelly response:', error.config?.url, error);
    return Promise.reject(error);
  }
);

export const changelly = {
  getTokenList: async (chainId: number) => {
    try {
      const response = await changellyApi.get(`/api/defi-swap/api/tokens/${chainId}`);
      const tokensArray = Object.values(response.data)
        .filter((token: any) => token.is_active)
        .sort((a: any, b: any) => (a.priority || 0) - (b.priority || 0));
      return tokensArray;
    } catch (error) {
      console.error('Error fetching tokens:', error);
      throw error;
    }
  },

  getBalances: (chainId: number, address: string) => 
    changellyApi.get(`/api/defi-swap/api/balances/${chainId}/${address}`),

  getGasPrices: async (chainId: number) => {
    try {
      const response = await changellyApi.get(`/api/defi-swap/api/gasprices/${chainId}`);
      return {
        data: {
          low: DEFAULT_GAS_PRICE,
          medium: DEFAULT_GAS_PRICE,
          high: DEFAULT_GAS_PRICE,
          ...response.data
        }
      };
    } catch (error) {
      console.error('Error fetching gas prices:', error);
      return {
        data: {
          low: DEFAULT_GAS_PRICE,
          medium: DEFAULT_GAS_PRICE,
          high: DEFAULT_GAS_PRICE
        }
      };
    }
  },

  getPrice: (
    chainId: number, 
    fromToken: string, 
    toToken: string, 
    amount: string,
    slippage: number,
    gasPrice: string = DEFAULT_GAS_PRICE
  ) => changellyApi.get(`/api/defi-swap/api/price/${chainId}/${fromToken}/${toToken}`, {
    params: {
      amount,
      slippage,
      gasPrice,
      firstFetch: '',
      _data: 'routes/defi-swap/api/price.$chainId.$from.$to'
    }
  }),

  getTokenGraph: (
    chainId: number,
    fromToken: string,
    toChainId: number,
    toToken: string,
    timeframe: '24H' | '1W' | '1Y' | 'AllTime',
    mode: string = 'SIMPLE_MODE'
  ) => changellyApi.get(`/api/defi-swap/api/graph/${chainId}/${fromToken}/${toChainId}/${toToken}/${timeframe}/${mode}`),

  getAllowance: (chainId: number, tokenAddress: string, walletAddress: string) => 
    changellyApi.get(`/api/defi-swap/api/allowance/${chainId}/${tokenAddress}/${walletAddress}`),

  getApproveTransaction: (chainId: number, tokenAddress: string, gasPrice: string = DEFAULT_GAS_PRICE) => 
    changellyApi.get(`/api/defi-swap/api/approve/${chainId}/${tokenAddress}/${gasPrice}`),

  getRoute: (
    chainId: number,
    fromToken: string,
    toToken: string,
    amount: string,
    slippage: number,
    gasPrice: string = DEFAULT_GAS_PRICE,
    takerAddress: string,
    recipientAddress?: string,
    toChainId?: string
  ) => {
    return changellyApi.get(`/api/defi-swap/api/route/${chainId}/${fromToken}/${toToken}`, {
      params: {
        amount,  
        slippage,
        gasPrice,
        takerAddress,
        recipientAddress: recipientAddress || '',
        toChainId: toChainId || '',
      },
      timeout: 30000,
      responseType: 'json'
    });
  },
};