
import { useState, useCallback } from 'react';
import { Token } from '../types/api';
import { changelly } from '../services/ChangellyService';

export function useTokenList(chainId?: number) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const fetchTokens = useCallback(async () => {
    if (!chainId) {
      setTokens([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(undefined);
      const tokensArray = await changelly.getTokenList(chainId);
      setTokens(tokensArray as Token[]);
    } catch (err) {
      console.error('Failed to fetch tokens:', err);
      setError('Failed to load tokens');
      setTokens([]);
    } finally {
      setLoading(false);
    }
  }, [chainId]);

  return {
    tokens,
    loading,
    error,
    fetchTokens
  };
}
