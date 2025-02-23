import { GasPrices, GasSpeed } from '../types/changelly';

const MINIMUM_GAS_PRICES: { [key: number]: { low: string; medium: string; high: string } } = {
  1: { // Ethereum
    low: '20000000000',    // 20 GWEI
    medium: '25000000000', // 25 GWEI
    high: '30000000000'    // 30 GWEI
  },
  56: { // BSC
    low: '3000000000',     // 3 GWEI
    medium: '3500000000',  // 3.5 GWEI
    high: '4000000000'     // 4 GWEI
  },
  137: { // Polygon
    low: '30000000000',    // 30 GWEI
    medium: '50000000000', // 50 GWEI
    high: '80000000000'    // 80 GWEI
  }
  // Add other chains as needed
};

const CHAIN_MULTIPLIERS: Record<number, number> = {
  1: 1e9,      // Ethereum (GWEI)
  56: 1e9,     // BSC (GWEI)
  137: 1e9,    // Polygon (GWEI)
  43114: 1e9,  // Avalanche (nAVAX)
  // Add other chains as needed
};

export class GasService {
  private static getMinimumGasPrice(chainId: number, speed: GasSpeed): string {
    return MINIMUM_GAS_PRICES[chainId]?.[speed] || '1000000000'; // 1 GWEI default
  }

  private static validateGasPrice(price: string, chainId: number, speed: GasSpeed): string {
    const minPrice = BigInt(this.getMinimumGasPrice(chainId, speed));
    const inputPrice = BigInt(price);
    return inputPrice < minPrice ? minPrice.toString() : price;
  }

  public static async getGasPrices(chainId: number): Promise<GasPrices> {
    try {
      const response = await fetch(`/api/v1/${chainId}/gasprices`);
      if (!response.ok) throw new Error('Failed to fetch gas prices');
      
      const data = await response.json();
      const multiplier = CHAIN_MULTIPLIERS[chainId] || 1e9;
      
      // Keep original GWEI values, only convert when needed
      return {
        low: data.low,
        medium: data.medium,
        high: data.high
      };
    } catch (error) {
      console.warn('Gas price fetch failed:', error);
      return {
        low: '5',    // 5 GWEI
        medium: '7', // 7 GWEI
        high: '10'   // 10 GWEI
      };
    }
  }

  public static gweiToWei(gwei: string): string {
    try {
      const gweiValue = parseFloat(gwei);
      if (isNaN(gweiValue) || gweiValue <= 0) return '1000000000'; // 1 GWEI default
      return Math.floor(gweiValue * 1e9).toString();
    } catch {
      return '1000000000'; // 1 GWEI default
    }
  }

  public static weiToGwei(wei: string): string {
    try {
      return (Number(wei) / 1e9).toFixed(2);
    } catch {
      return '0.00';
    }
  }

  public static getEstimatedCost(
    gasLimit: string, 
    gasPriceGwei: string, 
    nativeTokenPrice: number
  ): number {
    try {
      // Convert GWEI to native token units
      const gasPrice = BigInt(Math.floor(parseFloat(gasPriceGwei) * 1e9));
      const gasCost = (BigInt(gasLimit) * gasPrice) / BigInt(1e18);
      return Number(gasCost) * nativeTokenPrice;
    } catch {
      return 0;
    }
  }

  public static formatGasPrice(gwei: string): string {
    try {
      return `${parseFloat(gwei).toFixed(2)} GWEI`;
    } catch {
      return '0 GWEI';
    }
  }

  public static async getRecommendedSpeed(chainId: number): Promise<GasSpeed> {
    const prices = await this.getGasPrices(chainId);
    const mediumThreshold = BigInt(prices.medium) * BigInt(120) / BigInt(100); // 20% higher than medium
    
    if (BigInt(prices.high) > mediumThreshold) {
      return 'low';
    }
    return 'medium';
  }

  public static calculateGasCostInNative(gasLimit: string, gasPriceGwei: string): number {
    try {
      // Convert gas price from GWEI to WEI
      const gasPriceWei = BigInt(Math.floor(parseFloat(gasPriceGwei) * 1e9));
      const gasLimitBig = BigInt(gasLimit);
      
      // Calculate total gas cost in native token
      const totalWei = gasPriceWei * gasLimitBig;
      return Number(totalWei) / 1e18;
    } catch {
      return 0;
    }
  }

  public static formatGasCost(gasLimit: string, gasPriceGwei: string, nativeTokenPrice: number, symbol: string): string {
    const nativeAmount = this.calculateGasCostInNative(gasLimit, gasPriceGwei);
    const usdAmount = nativeAmount * nativeTokenPrice;
    
    return `${nativeAmount.toFixed(6)} ${symbol} ($${usdAmount.toFixed(2)})`;
  }

  public static calculateTransactionCost(
    gasLimit: string,
    gasPriceGwei: string,
    amount: string,
    isNativeToken: boolean
  ): { gasCostNative: number; totalCostNative: number } {
    try {
      // Convert gas price from GWEI to WEI
      const gasPriceWei = BigInt(Math.floor(parseFloat(gasPriceGwei) * 1e9));
      const gasLimitBig = BigInt(gasLimit);
      
      // Calculate gas cost in native token
      const gasCostWei = gasPriceWei * gasLimitBig;
      const gasCostNative = Number(gasCostWei) / 1e18;

      // If using native token, add the swap amount to get total cost
      const totalCostNative = isNativeToken 
        ? gasCostNative + (Number(amount) / 1e18)
        : gasCostNative;

      return { gasCostNative, totalCostNative };
    } catch (error) {
      console.error('Error calculating transaction cost:', error);
      return { gasCostNative: 0, totalCostNative: 0 };
    }
  }

  public static calculateGasForTransaction(
    chainId: number,
    gasLimit: string,
    gasPriceGwei: string,
    amount: string,
    isNativeToken: boolean
  ): { gasCost: string; totalCost: string } {
    try {
      // Convert everything to BigInt for accurate calculations
      const gasLimitBig = BigInt(gasLimit);
      const gasPriceWei = BigInt(Math.floor(parseFloat(gasPriceGwei) * 1e9));
      const amountBig = isNativeToken ? BigInt(amount) : BigInt(0);

      // Calculate gas cost in WEI
      const gasCostWei = gasLimitBig * gasPriceWei;
      
      // Calculate total cost (gas + amount for native tokens)
      const totalCostWei = gasCostWei + amountBig;

      return {
        gasCost: gasCostWei.toString(),
        totalCost: totalCostWei.toString()
      };
    } catch (error) {
      console.error('Gas calculation error:', error);
      return { gasCost: '0', totalCost: '0' };
    }
  }

  public static formatGasDisplay(chainId: number, wei: string): string {
    try {
      const valueInGwei = Number(wei) / 1e9;
      return `${valueInGwei.toFixed(6)} GWEI`;
    } catch {
      return '0 GWEI';
    }
  }
}