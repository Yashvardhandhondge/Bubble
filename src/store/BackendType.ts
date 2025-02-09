// types.ts
export interface UserSubscription {
    status: 'Free' | 'Premium';
    expiryDate: string | null;
    subscriptionId: string | null;
    periodStartAt: string | null;
    periodEndAt: string | null;
    cancelAtPeriodEnd: boolean;
    isActive: boolean;
  }
  
  export interface User {
    subscription: UserSubscription;
    _id: string;
    walletAddress: string;
    name: string;
    email: string;
    phone: string;
    customerId: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
  }
  
  export interface SubscriptionResponse {
    success: boolean;
    message: string;
    user: User;
  }
  
  export interface SubscriptionStatus {
    status: 'Free' | 'Premium';
    cancelAtPeriodEnd: boolean;
    expiryDate: string | null;
    isActive: boolean;
  }