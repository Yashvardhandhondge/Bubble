export interface ChangellyToken {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  is_active: boolean;
  priority: number;
  logoURI?: string;
  balance?: string;
}

export interface ChangellyQuote {
  amount_out_total: string;
  estimate_gas_total: string;
  gas_price: string;
  token_in: string;
  token_out: string;
  fee_recipient_amount?: string;
  routes?: {
    protocol_name: string;
    percent: number;
    pools: null;
    amount_in?: string;
    amount_out?: string;
  };
  calldata?: string;
  to?: string;
}

export interface SwapTransaction {
  calldata: string;
  estimate_gas: string;
  gas_price: string;
  to: string;
  value?: string;
}

export interface TokenListResponse {
  tokens: ChangellyToken[];
  total: number;
}

export interface GasPriceResponse {
  low: string;
  medium: string;
  high: string;
}

export interface TokenAllowance {
  remaining: string;
}

export interface ApproveTransaction {
  calldata: string;
  estimate_gas: string;
  gas_price: string;
  to: string;
}

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  is_active: boolean;
  // ...other fields if needed
}

export interface Quote {
  amount_out_total: string;
  estimate_gas_total: string;
  calldata?: string;
  to?: string;
  gas_price?: string;
  // ...other fields if needed
}
