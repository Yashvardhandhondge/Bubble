export interface Platform {
  chainId: number;
  name: string;
  shortname: string;
}

export interface Token {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  is_active: boolean;
  priority: number;
}

export interface GasPrices {
  low: string;
  medium: string;
  high: string;
}

export interface TokensListRequest {
  filter?: {
    addresses?: string[];
    chain_ids?: number[];
    is_active?: boolean;
    names?: string[];
    symbols?: string[];
  };
  paging: {
    page: number;
    page_size: number;
  };
}

export interface QuoteResponse {
  amount_out_total: string;
  estimate_gas_total: string;
  token_in: string;
  token_out: string;
  gas_price: string;
  fee_recipient_amount?: string;
  routes?: {
    protocol_name: string;
    percent: number;
    pools: any[] | null;
    amount_in: string;
    amount_out: string;
  };
  calldata: string;
  to: string;
}
