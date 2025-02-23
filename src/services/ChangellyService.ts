import { Token, Quote, GasPrices,GasPriceResponse, GasSpeed, TokenAllowance, ApproveTransaction, SwapTransaction,DetailedGasPriceResponse } from '../types/changelly';
import { GasService } from './Gasprice';
const API_KEY = '57d18ecb-7f0e-456c-a085-2d43ec6e2b3f';
const NATIVE_TOKEN = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const PROXY_BASE_URL = '/api';

const WRAPPED_TOKEN_MAPPING: Record<number, string> = {
  1: "0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2",      // WETH
  56: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",     // WBNB
  137: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",    // WMATIC
  10: "0x4200000000000000000000000000000000000006",      // WETH (Optimism)
  250: "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83",    // WFTM
  43114: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",  // WAVAX
  42161: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1"   // WETH (Arbitrum)
};

export class ChangellyService {
  private static async makeRequest(endpoint: string, options: RequestInit = {}) {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Api-Key': API_KEY,
      ...options.headers
    };

    const response = await fetch(`${PROXY_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

 
public static async getGasPrices(chainId: number): Promise<GasPrices> {
    try {
      const data: DetailedGasPriceResponse = await this.makeRequest(`/v1/${chainId}/gasprices`);
      
      // Convert GWEI to WEI and ensure minimum values
      const processGasPrice = (gwei: string) => {
        const minGwei = 1; // Minimum 1 GWEI
        const gweiValue = Math.max(parseFloat(gwei), minGwei);
        return Math.floor(gweiValue * 1e9).toString();
      };
  
      // If any of the values are 0 or invalid, use fallback values
      const lowGwei = data.low && parseFloat(data.low) > 0 ? data.low : '3';
      const mediumGwei = data.medium && parseFloat(data.medium) > 0 ? data.medium : '3.5';
      const highGwei = data.high && parseFloat(data.high) > 0 ? data.high : '5';
  
      // Convert to WEI and ensure minimum values
      return {
        low: processGasPrice(lowGwei),
        medium: processGasPrice(mediumGwei),
        high: processGasPrice(highGwei)
      };
    } catch (error) {
      console.warn('Gas price fetch failed, using fallback values:', error);
      // Fallback values in WEI (3 GWEI, 3.5 GWEI, 5 GWEI)
      return {
        low: '3000000000',     // 3 GWEI
        medium: '3500000000',  // 3.5 GWEI
        high: '5000000000'     // 5 GWEI
      };
    }
  }

  private static calculateSlippage(amount: string): string {
    const amountNum = parseFloat(amount);
    if (amountNum <= 100) return '15';      // 1.5% for small trades
    if (amountNum <= 1000) return '10';     // 1% for medium trades
    if (amountNum <= 10000) return '5';     // 0.5% for large trades
    return '3';                             // 0.3% for very large trades
  }

  private static calculateFee(amount: string): string {
    const amountNum = parseFloat(amount);
    if (amountNum <= 100) return '10';      // 1% for small trades
    if (amountNum <= 1000) return '7';      // 0.7% for medium trades
    if (amountNum <= 10000) return '5';     // 0.5% for large trades
    return '3';                             // 0.3% for very large trades
  }

  public static async getQuote(
    chainId: number,
    fromToken: Token,
    toToken: Token,
    amount: string,
    walletAddress?: string,
    selectedGasSpeed: GasSpeed = 'low'
  ): Promise<Quote> {
    try {
      // Get gas prices in GWEI (not converted to WEI)
      const gasPrices = await this.getGasPrices(chainId);
      const gasPriceGwei = gasPrices[selectedGasSpeed];

      // Important: Use correct token addresses
      const fromTokenAddress = fromToken.address.toLowerCase() === NATIVE_TOKEN.toLowerCase()
        ? WRAPPED_TOKEN_MAPPING[chainId]
        : fromToken.address;

      const toTokenAddress = toToken.address.toLowerCase() === NATIVE_TOKEN.toLowerCase()
        ? WRAPPED_TOKEN_MAPPING[chainId]
        : toToken.address;

      const params = new URLSearchParams({
        fromTokenAddress,
        toTokenAddress,
        amount,
        slippage: '1',
        gasPrice: gasPriceGwei, // Send raw GWEI value
        skipValidation: 'true'
      });

      if (walletAddress) {
        params.set('recipientAddress', walletAddress);
        params.set('takerAddress', walletAddress);
      }

      console.log('Quote request params:', {
        chainId,
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        amount,
        gasPrice: gasPriceGwei
      });

      // Get quote from API
      const quote = await this.makeRequest(`/v1/${chainId}/quote?${params.toString()}`);
      console.log('Quote response:', quote);

      return quote;
    } catch (error) {
      console.error('Quote error:', error);
      throw error;
    }
  }

  public static async executeSwap(
    chainId: number,
    fromToken: Token,
    toToken: Token,
    amount: string,
    walletAddress: string,
    selectedGasSpeed: GasSpeed = 'low'
  ): Promise<{ transaction: SwapTransaction; quote: Quote }> {
    try {
      const quote = await this.getQuote(
        chainId,
        fromToken,
        toToken,
        amount,
        walletAddress,
        selectedGasSpeed
      );
  
      const transaction: SwapTransaction = {
        from: walletAddress,
        to: quote.to,
        data: quote.calldata,
        value: fromToken.address.toLowerCase() === NATIVE_TOKEN.toLowerCase() 
          ? `0x${BigInt(amount).toString(16)}`
          : '0x0',
        gasPrice: `0x${BigInt(quote.gas_price).toString(16)}`,
        gas: `0x${BigInt(quote.estimate_gas_total).toString(16)}`,
      };
  
      return { transaction, quote };
    } catch (error) {
      console.error('Swap execution error:', error);
      throw error;
    }
  }
  


  public static async loadTokens(chainId: number): Promise<Token[]> {
    try {
      const data = await this.makeRequest('/v2/tokens/list', {
        method: 'POST',
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
      
      return Array.isArray(data.tokens) ? data.tokens : [];
    } catch (error) {
      console.error('Token loading error:', error);
      throw error;
    }
  }


 
public static async checkAndApproveToken(
    chainId: number,
    tokenAddress: string,
    amount: string,
    walletAddress: string,
    selectedGasSpeed: GasSpeed = 'low'
  ): Promise<ApproveTransaction | null> {
    try {
      // Get gas prices from API
      const gasPrices = await GasService.getGasPrices(chainId);
      const gasPrice = gasPrices[selectedGasSpeed];
  
      // Check allowance
      const allowanceData = await this.makeRequest(
        `/v1/${chainId}/transaction/allowance?tokenAddress=${tokenAddress}&walletAddress=${walletAddress}`
      );
  
      if (BigInt(allowanceData.remaining || '0') > BigInt(amount)) return null;
  
      // Get approval transaction with API gas price
      const approvalData = await this.makeRequest(
        `/v1/${chainId}/transaction/approve?tokenAddress=${tokenAddress}&amount=${amount}&gasPrice=${gasPrice}`
      );
  
      return {
        from: walletAddress,
        to: approvalData.to,
        calldata: approvalData.calldata,
        estimate_gas: approvalData.estimate_gas,
        gas_price: approvalData.gas_price
      };
    } catch (error) {
      console.error('Approval check error:', error);
      throw error;
    }
  }


  public static mapTokenAddress(chainId: number, tokenAddress: string): string {
    if (tokenAddress.toLowerCase() === NATIVE_TOKEN.toLowerCase()) {
      return WRAPPED_TOKEN_MAPPING[chainId] || tokenAddress;
    }
    return tokenAddress;
  }
}