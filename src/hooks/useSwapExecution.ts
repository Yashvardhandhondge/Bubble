// src/hooks/useSwapExecution.ts
import { useState } from 'react';
import { useAccount, useWriteContract, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, type Address } from 'viem';
import { erc20Abi } from 'viem';
import {changelly }from '../services/ChangellyService';
import { Token } from '../types/api';

export function useSwapExecution() {
  const { address } = useAccount();
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();
  const { data: receipt } = useWaitForTransactionReceipt();

  const checkAllowance = async (
    chainId: number,
    tokenAddress: string,
    spenderAddress: string,
    amount: string
  ) => {
    if (!address) return false;
    
    try {
      const response = await changelly.getAllowance(chainId, tokenAddress, address);
      const currentAllowance = BigInt(response.data.allowance || '0');
      const requiredAmount = BigInt(amount);
      return currentAllowance >= requiredAmount;
    } catch (err) {
      console.error('Failed to check allowance:', err);
      return false;
    }
  };

  const approveToken = async (
    chainId: number,
    tokenAddress: string,
    spenderAddress: string,
    amount: string
  ) => {
    if (!address) return false;
    
    try {
      setIsApproving(true);
      setError(undefined);

      // For BSC, use fixed gas price
      const gasPrice = BigInt('3500000000'); // 3.5 Gwei

      const hash = await writeContractAsync({
        address: tokenAddress as Address,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spenderAddress as Address, BigInt(amount)],
        gas: BigInt('300000'),
        gasPrice
      });

      // Wait for transaction confirmation
      await new Promise((resolve) => {
        const interval = setInterval(() => {
          if (receipt) {
            clearInterval(interval);
            resolve(receipt);
          }
        }, 1000);
      });

      setIsApproving(false);
      return true;
    } catch (err: any) {
      console.error('Approval failed:', err);
      if (err?.code === 'USER_REJECTED' || err?.message?.includes('User rejected')) {
        setError('Transaction was rejected by user');
      } else {
        setError('Failed to approve token');
      }
      setIsApproving(false);
      return false;
    }
  };

  const executeSwap = async (
    chainId: number,
    fromToken: Token,
    toToken: Token,
    amount: string,
    slippage: string
  ): Promise<`0x${string}` | undefined> => {
    if (!address) return undefined;
  
    try {
      setError(undefined);
      
      // Ensure amount is a valid number
      if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        throw new Error('Invalid amount');
      }
      
      // Convert the amount to the correct decimal representation for the token
      const actualAmountInDecimals = parseUnits(amount, fromToken.decimals).toString();
  
      console.log('Swap details:', {
        chainId,
        fromToken: fromToken.address,
        toToken: toToken.address,
        amount,
        amountInDecimals: actualAmountInDecimals,
        slippage: Number(slippage) * 10,
        userAddress: address
      });
      
      // Get route data with the actual amount
      const routeResponse = await changelly.getRoute(
        chainId,
        fromToken.address,
        toToken.address,
        actualAmountInDecimals,
        Number(slippage) * 10,
        '3500000000',
        address
      );
      
      console.log('Route API Response Status:', routeResponse.status);
      console.log('Route API Response Data:', JSON.stringify(routeResponse.data, null, 2));
  
      // Check if we got a valid response
      if (!routeResponse.data || !routeResponse.data.rawResponse) {
        console.error('Invalid route response:', routeResponse.data);
        throw new Error('Invalid or empty response from route API');
      }
  
      // Extract the swap parameters from the response
      const { to: spenderAddress, calldata, value } = routeResponse.data.rawResponse;
      
      if (!spenderAddress || !calldata) {
        throw new Error('Invalid route response – missing spender address or calldata');
      }
      
      // Prepare transaction parameters
      const txParams = {
        from: address,
        to: spenderAddress as Address,
        data: calldata as `0x${string}`,
        // Use value from API response if available, otherwise calculate based on token type
        value: value ? BigInt(value) : 
               fromToken.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
               ? BigInt(actualAmountInDecimals) 
               : undefined,
        gasPrice: BigInt('3500000000'),
        gas: BigInt(routeResponse.data.rawResponse.estimate_gas_total || '300000')
      };
  
      console.log('Transaction Parameters:', {
        to: txParams.to,
        value: txParams.value?.toString(),
        gasPrice: txParams.gasPrice.toString(),
        gas: txParams.gas.toString(),
      });
  
      // Execute the transaction
      const hash = await sendTransactionAsync(txParams);
      console.log('Transaction sent with hash:', hash);
  
      // Wait for transaction receipt
      await new Promise((resolve) => {
        const interval = setInterval(() => {
          if (receipt) {
            clearInterval(interval);
            resolve(receipt);
          }
        }, 1000);
      });
  
      return hash;
    } catch (err) {
      console.error('Swap failed:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to execute swap');
      }
      return undefined;
    }
  };

  return {
    isApproving,
    error,
    executeSwap,
    approveToken,
    checkAllowance
  };
}