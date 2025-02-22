import { Token, Quote } from '../types/changelly';

const API_KEY = '57d18ecb-7f0e-456c-a085-2d43ec6e2b3f';
const NATIVE_PLACEHOLDER = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

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
  // Map token addresses (replacing native placeholder with wrapped token if necessary)
  public static mapTokenAddress(chainId: number, tokenAddress: string): string {
    if (tokenAddress.toLowerCase() === NATIVE_PLACEHOLDER.toLowerCase()) {
      return WRAPPED_TOKEN_MAPPING[chainId] || tokenAddress;
    }
    return tokenAddress;
  }

  // Get a quote from Changelly API with proper error and response handling
  public static async getQuote(
    chainId: number,
    fromToken: Token,
    toToken: Token,
    amount: string,
    walletAddress?: string
  ): Promise<Quote> {
    // Format amount using the provided amount and token decimals
    const amountInDecimals = amount; // assume already formatted externally or use your parseUnits
    const mappedFrom = this.mapTokenAddress(chainId, fromToken.address);
    const mappedTo = this.mapTokenAddress(chainId, toToken.address);

    const params = new URLSearchParams({
      fromTokenAddress: mappedFrom,
      toTokenAddress: mappedTo,
      amount: amountInDecimals,
      slippage: '10',
      gasPrice: '16000000000',
      skipValidation: 'true'
    });

    if (walletAddress) {
      params.set('feeRecipient', walletAddress);
      params.set('recipientAddress', walletAddress);
      params.set('takerAddress', walletAddress);
      params.set('buyTokenPercentageFee', '1');
      params.set('sellTokenPercentageFee', '1');
    }

    console.log('Requesting quote with params:', params.toString());

    const url = `/api/v1/${chainId}/quote?${params.toString()}`;
    const response = await fetch(url, { headers: { 'X-Api-Key': API_KEY } });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    // Read response as text to capture empty responses (for debugging)
    const responseText = await response.text();
    console.log('Raw quote response:', responseText);
    
    if (!responseText) {
      throw new Error('Empty response received');
    }
    
    let data: Quote;
    try {
      data = JSON.parse(responseText);
    } catch (err) {
      throw new Error('JSON parsing error: ' + err);
    }
    
    if (!data.amount_out_total) {
      throw new Error('Invalid quote response - missing amount_out_total');
    }
    
    return data;
  }
}
