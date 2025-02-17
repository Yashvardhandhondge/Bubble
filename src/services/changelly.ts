const API_KEY = import.meta.env.VITE_CHANGELLY_API_KEY;
const API_URL = 'https://api.changelly.com/v3';

export const ChangellyService = {
  // Get available tokens
  getTokens: async () => {
    try {
      const response = await fetch(`${API_URL}/tokens`, {
        headers: {
          'api-key': API_KEY,
          'Content-Type': 'application/json'
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching tokens:', error);
      throw error;
    }
  },

  // Get exchange rate
  getExchangeRate: async (fromToken: string, toToken: string, amount: string) => {
    try {
      const response = await fetch(`${API_URL}/exchange-rate`, {
        method: 'POST',
        headers: {
          'api-key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromToken,
          to: toToken,
          amount
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Error getting exchange rate:', error);
      throw error;
    }
  },

  // Create exchange transaction
  createTransaction: async (fromToken: string, toToken: string, amount: string, address: string) => {
    try {
      const response = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: {
          'api-key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromToken,
          to: toToken,
          amount,
          address
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }
};
