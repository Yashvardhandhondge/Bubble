import axios from 'axios';
import { ChangellyToken, ChangellyQuote, SwapTransaction, TokenListResponse, GasPriceResponse, TokenAllowance, ApproveTransaction } from "../types/changelly";

// Use the proxy URL so that the request is sent to '/api' which Vite proxies to the target.
const API_URL = '/api';
const API_KEY = '57d18ecb-7f0e-456c-a085-2d43ec6e2b3f';

if (!API_KEY) {
  throw new Error('VITE_CHANGELLY_API_KEY is not defined');
}

// Helper: Replace native placeholder with wrapped token address based on chainId.
function mapTokenAddress(chainId: number, tokenAddress: string): string {
  const NATIVE_PLACEHOLDER = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
  if (tokenAddress.toLowerCase() === NATIVE_PLACEHOLDER) {
    const mapping: Record<number, string> = {
      1: "0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2",      // Wrapped ETH for Ethereum
      56: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",       // WBNB for BSC
      137: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",       // WMATIC for Polygon
      10: "0x4200000000000000000000000000000000000006",       // Optimism Ether (if needed)
      250: "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83",       // Wrapped FTM for Fantom
      43114: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",     // Wrapped AVAX for Avalanche
      42161: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1"      // Wrapped ETH for Arbitrum
    };
    return mapping[chainId] || tokenAddress;
  }
  return tokenAddress;
}

export class ChangellyService {
  private static async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${API_URL}/${endpoint}`, {
        ...options,
        headers: {
          'X-Api-Key': API_KEY,
          'Content-Type': 'application/json',
          ...options.headers,
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Changelly API Error:', error);
      throw error;
    }
  }

  static async getTokens(symbol: string): Promise<ChangellyToken[]> {
    try {
      // Pass the filter using the provided symbol
      const response = await axios.post(
        `${API_URL}/v2/tokens/list`,
        {
          filter: { symbol },
          paging: { page: 1, page_size: 100 }
        },
        {
          headers: { 'X-Api-Key': API_KEY }
        }
      );
      // Transform tokens: if token.symbol contains only digits, replace it with an abbreviation
      let tokens = response.data.tokens || [];
      tokens = tokens.map((token: ChangellyToken) => {
        if (/^\d+$/.test(token.symbol)) {
          // Using first three letters of token name (uppercased) as a fallback abbreviation.
          return { ...token, symbol: token.name.slice(0, 3).toUpperCase() };
        }
        return token;
      });
      return tokens;
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
      throw error;
    }
  }

  static async getGasPrice(chainId: number): Promise<GasPriceResponse> {
    const response = await fetch(`${API_URL}/v1/${chainId}/gasprices`, {
      method: 'GET',
      headers: {
        'X-Api-Key': API_KEY
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get gas price');
    }

    return response.json();
  }

  static async checkAllowance(
    chainId: number,
    tokenAddress: string,
    walletAddress: string
  ): Promise<TokenAllowance> {
    const queryParams = new URLSearchParams({
      tokenAddress,
      walletAddress
    }).toString();

    return this.request<TokenAllowance>(
      `v1/${chainId}/transaction/allowance?${queryParams}`
    );
  }

  static async getApproveTransaction(
    chainId: number,
    tokenAddress: string,
    amount: string
  ): Promise<ApproveTransaction> {
    const queryParams = new URLSearchParams({
      tokenAddress,
      amount
    }).toString();

    return this.request<ApproveTransaction>(
      `v1/${chainId}/transaction/approve?${queryParams}`
    );
  }

  static async getQuote(
    chainId: number,
    fromToken: string,
    toToken: string,
    amount: string,
    walletAddress?: string  // added optional wallet address parameter
  ): Promise<ChangellyQuote> {
    try {
      if (!chainId || !fromToken || !toToken || !amount) {
        throw new Error('Missing required parameters');
      }
      // Map native tokens to wrapped tokens in both fields
      const mappedFrom = mapTokenAddress(chainId, fromToken);
      const mappedTo   = mapTokenAddress(chainId, toToken);

      // Build query string with additional parameters per YAML
      const params = new URLSearchParams({
        fromTokenAddress: mappedFrom,
        toTokenAddress: mappedTo,
        amount: amount,
        slippage: '10',          // 1% slippage
        gasPrice: '16000000000', // default gas price; adjust as needed
        feeRecipient: walletAddress || '',  // use wallet if provided
        buyTokenPercentageFee: '1',  
        sellTokenPercentageFee: '1',
        recipientAddress: walletAddress || '',
        takerAddress: walletAddress || '',
        skipValidation: 'true'
      });
      // --- Modified: Always pass walletAddress fields if available ---
      if (walletAddress) {
        params.set('feeRecipient', walletAddress);
        params.set('recipientAddress', walletAddress);
        params.set('takerAddress', walletAddress);
      }
      const requestURL = `${API_URL}/v1/${chainId}/quote?${params.toString()}`;
      console.log('Sending GET request to:', requestURL);
      const response = await axios.get(requestURL, {
        headers: {
          'X-Api-Key': API_KEY
        }
      });
      if (!response.data?.amount_out_total) {
        throw new Error('Invalid quote response');
      }
      return response.data;
    } catch (error) {
      console.error('Quote error:', error);
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Quote failed: ${message}`);
      }
      throw new Error(`Failed to get quote: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  static async getSwapTransaction(
    chainId: number,
    fromToken: string,
    toToken: string,
    amount: string,
    walletAddress: string
  ): Promise<ChangellyQuote> {
    try {
      if (!chainId || !fromToken || !toToken || !amount || !walletAddress) {
        throw new Error('Missing required parameters');
      }
      // Map native tokens to wrapped tokens
      const mappedFrom = mapTokenAddress(chainId, fromToken);
      const mappedTo   = mapTokenAddress(chainId, toToken);
      const params = new URLSearchParams({
        fromTokenAddress: mappedFrom,
        toTokenAddress: mappedTo,
        amount: amount,
        slippage: '10',
        gasPrice: '16000000000',
        recipientAddress: walletAddress,
        takerAddress: walletAddress,
        skipValidation: 'true'
      });
      const response = await axios.get(
        `${API_URL}/v1/${chainId}/quote?${params.toString()}`,
        {
          headers: {
            'X-Api-Key': API_KEY
          }
        }
      );
      if (!response.data?.calldata || !response.data?.to) {
        throw new Error('Invalid swap transaction response');
      }
      return response.data;
    } catch (error) {
      console.error('Swap transaction error:', error);
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.response?.statusText || 'Unknown error';
        throw new Error(`Swap transaction failed: ${message}`);
      }
      throw new Error(`Failed to get swap transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}