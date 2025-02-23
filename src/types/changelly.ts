export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  is_active: boolean;
  priority?: number;
  logoURI?: string;
  balance?: string;
  chainId?: number;
}

export interface Quote {
  amount_out_total: string;
  estimate_gas_total: string;
  gas_price: string;
  token_in: string;
  token_out: string;
  to: string;
  calldata: string;
  fee_recipient_amount?: string;
  routes?: {
    protocol_name: string;
    percent: number;
    pools: null;
    amount_in?: string;
    amount_out?: string;
  };
}

export interface SwapTransaction {
  from: string;     // Added this field
  to: string;
  data: string;     // Changed calldata to data for wallet compatibility
  gasPrice: string; // Changed gas_price to gasPrice for wallet compatibility
  gas: string;      // Changed estimate_gas to gas for wallet compatibility
  value?: string;
}

export interface TokenListResponse {
  tokens: Token[];
  total: number;
}

export interface GasPrices {
  low: string;
  medium: string;
  high: string;
}

export interface TokenAllowance {
  remaining: string;
}

export interface ApproveTransaction {
  from: string;
  to: string;
  calldata: string;
  estimate_gas: string;
  gas_price: string;
}
interface GasPriceInfo {
  price: string;
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
}

export interface GasPriceResponse {
  baseFee: string;
  low: string;
  medium: string;
  high: string;
  lowInfo: GasPriceInfo;
  mediumInfo: GasPriceInfo;
  highInfo: GasPriceInfo;
}

export interface DetailedGasPriceResponse {
  baseFee: string;
  high: string;
  medium: string;
  low: string;
  highInfo: GasPriceInfo;
  mediumInfo: GasPriceInfo;
  lowInfo: GasPriceInfo;
}

export type GasSpeed = 'low' | 'medium' | 'high';