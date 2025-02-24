// src/hooks/useSwap.ts
import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { Token } from '../types/api';
import { changelly } from '../services/ChangellyService';

const DEFAULT_GAS_PRICE = '3500000000';

interface PriceResponse {
  amountOut: string;
  gasUnitsConsumed: number;
  rawResponse: {
    amount_out_total: string;
    estimate_gas_total: string;
    fee_recipient_amount: string;
    gas_price: string;
    routes: Array<{
      type: string;
      protocol_name: string;
      amount_in: string;
      amount_out: string;
      percent: number;
      pools: Array<any>;
    }>;
    token_in: string;
    token_out: string;
  };
}

export function useSwap() {
  const { address, chain } = useAccount();
  const [fromToken, setFromToken] = useState<Token | undefined>(undefined);
  const [toToken, setToToken] = useState<Token | undefined>(undefined);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState('1.0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [priceGraphData, setPriceGraphData] = useState<any>(null);
  const [routeData, setRouteData] = useState<any>(null);

  const fetchPrice = useCallback(async () => {
    if (!chain?.id || !fromToken || !toToken || !address || !fromAmount || Number(fromAmount) <= 0) {
      setToAmount('');
      setRouteData(null);
      return;
    }

    try {
      setLoading(true);
      setError(undefined);

      const parsedAmount = parseUnits(
        fromAmount,
        fromToken.decimals
      ).toString();

      console.log('Requesting quote with params:', {
        chainId: chain.id,
        fromToken: fromToken.address,
        toToken: toToken.address,
        amount: parsedAmount,
        slippage: Number(slippage) * 10,
        gasPrice: DEFAULT_GAS_PRICE
      });

      const response = await changelly.getPrice(
        chain.id,
        fromToken.address,
        toToken.address,
        parsedAmount,
        Number(slippage) * 10,
        DEFAULT_GAS_PRICE
      );

      const priceData = response.data as PriceResponse;

      if (!priceData || !priceData.rawResponse?.amount_out_total || !priceData.rawResponse?.routes?.length) {
        throw new Error('No valid route found for this swap');
      }

      // Store route data for later use
      setRouteData(priceData.rawResponse);

      // Calculate output amount
      const outputAmount = formatUnits(
        BigInt(priceData.rawResponse.amount_out_total),
        toToken.decimals
      );

      setToAmount(outputAmount);
      setError(undefined);

      // Fetch price graph data
      try {
        const graphResponse = await changelly.getTokenGraph(
          chain.id,
          fromToken.address,
          chain.id,
          toToken.address,
          '24H'
        );
        setPriceGraphData(graphResponse.data);
      } catch (graphErr) {
        console.error('Failed to fetch price graph:', graphErr);
      }

    } catch (err) {
      console.error('Quote error:', err);
      setToAmount('');
      setRouteData(null);
      if (err instanceof Error) {
        if (err.message.includes('No liquidity')) {
          setError('No liquidity available for this swap. Try a different amount or pair.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to fetch quote');
      }
    } finally {
      setLoading(false);
    }
  }, [chain?.id, fromToken, toToken, fromAmount, slippage, address]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (fromToken && toToken && fromAmount && Number(fromAmount) > 0 && chain && address) {
        fetchPrice();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [fetchPrice]);

  const fetchBalances = useCallback(async () => {
    if (!chain?.id || !address) return {};
    try {
      const response = await changelly.getBalances(chain.id, address);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch balances:', err);
      return {};
    }
  }, [chain?.id, address]);

  const handleAmountChange = (amount: string) => {
    // Only allow numbers and dots
    const cleanAmount = amount.replace(/[^0-9.]/g, '');
    // Prevent multiple dots
    if (cleanAmount.split('.').length > 2) return;
    setFromAmount(cleanAmount);
  };

  return {
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    slippage,
    loading,
    error,
    priceGraphData,
    routeData,
    setFromToken,
    setToToken,
    setFromAmount: handleAmountChange,
    setSlippage,
    fetchBalances,
    fetchPrice
  };
}