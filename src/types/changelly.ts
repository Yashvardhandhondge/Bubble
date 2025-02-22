export interface ChangellyToken {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  chainId: number;
  logoURI?: string;
  balance?: string;
  is_active: boolean;
}

export interface ChangellyQuote {
  amount_out_total: string;
  estimate_gas_total: string;
  token_in: string;
  token_out: string;
  gas_price: string;
  fee_recipient_amount: string;
  routes: {
    protocol_name: string;
    percent: number;
    pools: any[];
    amount_in: string;
    amount_out: string;
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
