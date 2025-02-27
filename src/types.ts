export interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  marketCap: number;
  price: number;
  volume24h: number;
  percentChange: number;
  rank: number;
  launchDate?: string;
  riskLevel: number; // 0-100
  risk: number; // new property
  icon?: string; // new optional property
  volume?: number;
  moralisLink?: string;
  warnings?: string[];
  '1mChange'?: number;
  '2wChange'?: number;
  '3mChange'?: number;
  bubbleSize?: number;
}

export interface TimeframeData {
  timestamp: number;
  price: number;
}

export type Timeframe = 'Hour' | 'Day' | 'Week' | 'Month' | 'Year';

export type ViewType = 'chart' | 'settings' | 'menu';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  billingCycle: 'monthly' | 'yearly';
}

export interface UserProfile {
  id: string;
  address?: string;
  email?: string;
  fullName?: string;
  telegramUsername?: string;
  tradingViewUsername?: string;
  subscriptionStatus: SubscriptionStatus;
  favorites: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionStatus {
  status: 'Free' | 'Premium';
  cancelAtPeriodEnd: boolean;
  expiryDate?: string | null;
  isActive: boolean;
  plan?: string;
  startDate?: Date;
  endDate?: Date;
  canceledAt?: Date;
  trialEnd?: Date;
}

export interface PaymentDetails {
  fullName: string;
  email: string;
  plan: 'premium' | 'test';
  amount: number;
  walletAddress?: string;
}

export interface PaymentState {
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
  sessionId?: string;
}

export interface WalletTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  chainId: number;
}

export interface Strategy {
  id: string;
  name: string;
  type: 'short' | 'long' | 'rsi';
  isActive: boolean;
  settings?: Record<string, any>;
}

export interface SignalData {
  description: string;
  // Old risks array replaced by warnings and warning_count:
  warnings: string[];
  warning_count: number;
  // New fields from API response:
  positives: string[];
  date: string;
  link: string;
  symbol: string;
  price: number;
  risk: number;
  risk_usdt: number;
  // Optionally keep risks as optional if needed:
  risks?: string[];
}