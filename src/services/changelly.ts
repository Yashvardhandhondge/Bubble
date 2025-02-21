import { 
  ChangellyQuote, 
  ChangellyToken, 
  SwapTransaction, 
  TokenListResponse,
  GasPriceResponse 
} from '../types/changelly';

// Make sure API key exists
const API_KEY = import.meta.env.VITE_CHANGELLY_API_KEY;
if (!API_KEY) {
  throw new Error('VITE_CHANGELLY_API_KEY is not defined in environment variables');
}

const API_URL = 'https://dex-api.changelly.com'; // Use direct URL instead of proxy

export class ChangellyService {
  private static async fetchWithKey(endpoint: string, options: RequestInit = {}) {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'X-Api-Key': API_KEY,
          'Content-Type': 'application/json',
          ...options.headers,
        }
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('API Error Response:', error);
        throw new Error(error.message || `Failed to fetch from Changelly API: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  static async getTokens(chainId: number): Promise<ChangellyToken[]> {
    try {
      // Make a simple POST request with required headers and body
      const response = await fetch(`${API_URL}/v2/tokens/list`, {
        method: 'POST',
        headers: {
          'X-Api-Key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paging: {
            page: 1,
            page_size: 100
          },
          filter: {
            chain_ids: [chainId],
            is_active: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tokens: ${response.statusText}`);
      }

      const data = await response.json();
      return data.tokens || [];
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
      return [];
    }
  }

  static async getGasPrice(chainId: number): Promise<GasPriceResponse> {
    return this.fetchWithKey(`/v1/${chainId}/gasprices`, {
      method: 'GET',
      headers: {
        'X-Api-Key': API_KEY
      }
    });
  }

  static async getQuote(
    fromToken: string,
    toToken: string,
    amount: string,
    chainId: number
  ): Promise<ChangellyQuote> {
    const queryParams = new URLSearchParams({
      fromTokenAddress: fromToken,
      toTokenAddress: toToken,
      amount: amount,
      slippage: '1'
    }).toString();

    return this.fetchWithKey(`/v1/${chainId}/quote?${queryParams}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': API_KEY
      }
    });
  }

  static async getSwapTransaction(
    fromToken: string,
    toToken: string,
    amount: string,
    chainId: number,
    walletAddress: string
  ): Promise<SwapTransaction> {
    const queryParams = new URLSearchParams({
      fromTokenAddress: fromToken,
      toTokenAddress: toToken,
      amount: amount,
      slippage: '1',
      takerAddress: walletAddress
    }).toString();

    return this.fetchWithKey(`/v1/${chainId}/transaction/quote?${queryParams}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': API_KEY
      }
    });
  }
}
