import { ChangellyToken,ChangellyQuote,SwapTransaction,TokenListResponse,GasPriceResponse, TokenAllowance,ApproveTransaction} from "../types/changelly";

const API_KEY = import.meta.env.VITE_CHANGELLY_API_KEY;
if (!API_KEY) {
  throw new Error('VITE_CHANGELLY_API_KEY is not defined');
}

export class ChangellyService {
  private static readonly API_URL = '/api'; // Use proxy URL

  private static async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${this.API_URL}${endpoint}`, {
        ...options,
        headers: {
          'X-Api-Key': "57d18ecb-7f0e-456c-a085-2d43ec6e2b3f",
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

  static async getTokens(chainId: number): Promise<ChangellyToken[]> {
    try {
      const response = await fetch(`${this.API_URL}/v2/tokens/list`, {
        method: 'POST',
        headers: {
          'X-Api-Key': '57d18ecb-7f0e-456c-a085-2d43ec6e2b3f',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filter: {
            chain_ids: [chainId],
            is_active: true
          },
          paging: {
            page: 1,
            page_size: 100
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Token list error:', errorData);
        throw new Error(`Failed to fetch tokens: ${response.statusText}`);
      }

      const data = await response.json();
      return data.tokens || [];
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
      throw error;
    }
  }

  static async getGasPrice(chainId: number): Promise<GasPriceResponse> {
    const response = await fetch(`${this.API_URL}/v1/${chainId}/gasprices`, {
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
      `/v1/${chainId}/transaction/allowance?${queryParams}`
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
      `/v1/${chainId}/transaction/approve?${queryParams}`
    );
  }

  static async getQuote(
    chainId: number,
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string
  ): Promise<ChangellyQuote> {
    try {
      const response = await fetch(`${this.API_URL}/v1/${chainId}/quote`, {
        method: 'GET',
        headers: {
          'X-Api-Key': '57d18ecb-7f0e-456c-a085-2d43ec6e2b3f'
        },
        body: JSON.stringify({
          fromTokenAddress,
          toTokenAddress,
          amount,
          slippage: '1'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get quote');
      }

      return response.json();
    } catch (error) {
      console.error('Quote error:', error);
      throw error;
    }
  }

  static async getSwapTransaction(
    chainId: number,
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    walletAddress: string
  ): Promise<SwapTransaction> {
    try {
      const response = await fetch(`${this.API_URL}/v1/${chainId}/transaction/quote`, {
        method: 'GET',
        headers: {
          'X-Api-Key': '57d18ecb-7f0e-456c-a085-2d43ec6e2b3f'
        },
        body: JSON.stringify({
          fromTokenAddress,
          toTokenAddress,
          amount,
          slippage: '1',
          takerAddress: walletAddress
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get swap transaction');
      }

      return response.json();
    } catch (error) {
      console.error('Swap transaction error:', error);
      throw error;
    }
  }
}