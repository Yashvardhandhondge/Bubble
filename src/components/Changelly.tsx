import React, { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useChainId, useSwitchChain } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { ConnectButton } from '@rainbow-me/rainbowkit';


// New: declare global for window.ethereum to fix TS errors
declare global {
	interface Window {
		ethereum?: any;
	}
}

// New: Token and Quote type declarations
interface Token {
	address: string;
	symbol: string;
	name: string;
	decimals: number;
	is_active: boolean;
	// ...other fields if necessary
}

interface Quote {
	amount_out_total: string;
	estimate_gas_total: string;
	// ...other fields if necessary
}

interface ChangellyDEXProps {
	onClose: () => void;
	className?: string;
}

const NATIVE_TOKEN = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const WRAPPED_TOKEN_MAPPING: Record<number, string> = {
	1: "0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2",
	56: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
	137: "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
	10: "0x4200000000000000000000000000000000000006",
	250: "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83",
	43114: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
	42161: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1"
};

const mapTokenAddress = (tokenAddress: string, chainId: number): string => {
	if (tokenAddress.toLowerCase() === NATIVE_TOKEN.toLowerCase()) {
		return WRAPPED_TOKEN_MAPPING[chainId] || tokenAddress;
	}
	return tokenAddress;
};

const SUPPORTED_CHAINS = [
	{ id: 1, name: 'Ethereum', shortname: 'ETH' },
	{ id: 10, name: 'Optimistic Ethereum', shortname: 'Optimism' },
	{ id: 56, name: 'BNB Smart Chain', shortname: 'BSC' },
	{ id: 137, name: 'Polygon', shortname: 'MATIC' },
	{ id: 250, name: 'Fantom', shortname: 'FTM' },
	{ id: 43114, name: 'Avalanche', shortname: 'AVAX' },
	{ id: 42161, name: 'Arbitrum', shortname: 'Arbitrum' }
];

const ChangellyDEX: React.FC<ChangellyDEXProps> = ({ onClose, className = '' }) => {
	const { address } = useAccount();
	const chainId = useChainId();
	const { switchChain } = useSwitchChain();

	const [selectedChain, setSelectedChain] = useState(SUPPORTED_CHAINS[0]);
	const [tokens, setTokens] = useState<Token[]>([]);
	const [fromToken, setFromToken] = useState<Token | null>(null);
	const [toToken, setToToken] = useState<Token | null>(null);
	const [amount, setAmount] = useState<string>('');
	const [loading, setLoading] = useState(false);
	const [quote, setQuote] = useState<Quote | null>(null);
	const [isSwapping, setIsSwapping] = useState(false);
	const [showChainSelector, setShowChainSelector] = useState(false);

	// Load tokens on chain change using fetch
	useEffect(() => {
		const loadTokens = async () => {
			try {
				setLoading(true);
				const response = await fetch(`/api/v1/${selectedChain.id}/tokens`);
				if (!response.ok) throw new Error(`API error: ${response.status}`);
				const jsonData = await response.json();
				let tokenList: Token[] = [];
				if (Array.isArray(jsonData)) {
					tokenList = jsonData;
				} else if (jsonData && Array.isArray(jsonData.tokens)) {
					tokenList = jsonData.tokens;
				} else {
					console.error("Expected an array but got:", jsonData);
				}
				setTokens(tokenList);
				if (tokenList.length > 0) {
					setFromToken(tokenList[0]);
					setToToken(tokenList[0]);
				}
				setQuote(null);
			} catch (error: any) {
				console.error('Failed to load tokens:', error);
				toast.error('Failed to load tokens');
			} finally {
				setLoading(false);
			}
		};
		loadTokens();
	}, [selectedChain.id]);

	// Fetch quote with proper parameter formatting and error handling
	// Updated fetch quote function
const fetchQuote = useCallback(async () => {
	if (!fromToken || !toToken || !amount || parseFloat(amount) <= 0 || !address) {
	  setQuote(null);
	  return;
	}
  
	try {
	  setLoading(true);
	  const amountInDecimals = parseUnits(amount, fromToken.decimals).toString();
  
	  // Log the request parameters for debugging
	  console.log('Quote Request Parameters:', {
		chainId: selectedChain.id,
		fromToken: fromToken.address,
		toToken: toToken.address,
		amount: amountInDecimals,
		decimals: fromToken.decimals,
		address: address
	  });
  
	  const params = new URLSearchParams({
		fromTokenAddress: fromToken.address,
		toTokenAddress: toToken.address,
		amount: amountInDecimals,
		slippage: '10',
		gasPrice: '16000000000',
		feeRecipient: address,
		buyTokenPercentageFee: '1',
		sellTokenPercentageFee: '1',
		recipientAddress: address,
		takerAddress: address,
		skipValidation: 'true'
	  });
  
	  // Make sure to include proper headers
	  const response = await fetch(`/api/v1/${selectedChain.id}/quote?${params.toString()}`, {
		method: 'GET',
		headers: {
		  'X-Api-Key': '57d18ecb-7f0e-456c-a085-2d43ec6e2b3f',
		  'Accept': 'application/json',
		  'Content-Type': 'application/json'
		}
	  });
  
	  // Log the raw response
	  console.log('Response status:', response.status);
	  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  
	  if (!response.ok) {
		const errorText = await response.text();
		console.error('Error response:', errorText);
		throw new Error(`API error: ${response.status} - ${errorText}`);
	  }
  
	  // Read the response text and log it
	  const responseText = await response.text();
	  console.log('Raw response text:', responseText);
  
	  if (!responseText || responseText.trim() === '') {
		throw new Error('Empty response received');
	  }
  
	  // Parse the response
	  let data: Quote;
	  try {
		data = JSON.parse(responseText);
		console.log('Parsed quote data:', data);
	  } catch (parseError) {
		console.error('JSON parse error:', parseError);
		throw new Error('Failed to parse quote response');
	  }
  
	  // Validate the quote data
	  if (!data.amount_out_total) {
		throw new Error('Invalid quote response - missing amount_out_total');
	  }
  
	  setQuote(data);
	} catch (error: any) {
	  console.error('Quote error:', error);
	  toast.error(`Failed to get quote: ${error.message}`);
	  setQuote(null);
	} finally {
	  setLoading(false);
	}
  }, [fromToken, toToken, amount, selectedChain.id, address]);
  
  // Add this effect to manage the quote fetching with proper debouncing
  useEffect(() => {
	let timeoutId: NodeJS.Timeout | undefined;
  
	if (fromToken && toToken && amount && parseFloat(amount) > 0 && address) {
	  // Clear any existing timeout
	  if (timeoutId) {
		clearTimeout(timeoutId);
	  }
  
	  // Set a new timeout
	  timeoutId = setTimeout(() => {
		fetchQuote();
	  }, 500);
	} else {
	  setQuote(null);
	}
  

	return () => {
	  if (timeoutId) {
		clearTimeout(timeoutId);
	  }
	};
  }, [fetchQuote, fromToken, toToken, amount, address]);

	useEffect(() => {
		const timer = setTimeout(fetchQuote, 500);
		return () => clearTimeout(timer);
	}, [fetchQuote]);

	const handleSwap = async () => {
		if (!fromToken || !toToken || !amount || !address) {
			toast.error('Please fill all fields and connect wallet');
			return;
		}
		try {
			setIsSwapping(true);
			if (chainId !== selectedChain.id) {
				await switchChain({ chainId: selectedChain.id });
			}
			const amountInDecimals = parseUnits(amount, fromToken.decimals).toString();
			const mappedFrom = mapTokenAddress(fromToken.address, selectedChain.id);

			if (mappedFrom.toLowerCase() !== NATIVE_TOKEN.toLowerCase()) {
				const hasAllowance = await checkAllowance(mappedFrom, amountInDecimals);
				if (!hasAllowance) {
					toast('Approval needed. Please approve the transaction...', {
						icon: 'ℹ️'
					});
					const approvalTx = await getApprovalTransaction(mappedFrom, amountInDecimals);
					const approvalHash = await window.ethereum.request({
						method: 'eth_sendTransaction',
						params: [{
							from: address,
							to: approvalTx.to,
							data: approvalTx.calldata,
							gasPrice: approvalTx.gas_price,
						}],
					});
					toast.success('Approval transaction submitted');
					// Monitor approval until confirmed
					let approvalConfirmed = false, attempts = 0;
					while (!approvalConfirmed && attempts < 20) {
						const receipt = await window.ethereum.request({
							method: 'eth_getTransactionReceipt',
							params: [approvalHash],
						});
						if (receipt && (receipt.status === '0x1' || receipt.status === 1)) {
							approvalConfirmed = true;
							toast.success('Approval confirmed');
						} else {
							await new Promise(res => setTimeout(res, 2000));
							attempts++;
						}
					}
					if (!approvalConfirmed) {
						throw new Error('Approval transaction failed or timed out');
					}
				}
			}

			// Build swap quote parameters
			const params = new URLSearchParams({
				fromTokenAddress: mappedFrom,
				toTokenAddress: mapTokenAddress(toToken.address, selectedChain.id),
				amount: amountInDecimals,
				slippage: '10',
				gasPrice: '16000000000',
				feeRecipient: address,
				buyTokenPercentageFee: '1',
				sellTokenPercentageFee: '1',
				recipientAddress: address,
				takerAddress: address,
				skipValidation: 'true'
				});
				const response = await fetch(`/api/v1/${selectedChain.id}/quote?${params.toString()}`, {
				headers: { 'X-Api-Key': '57d18ecb-7f0e-456c-a085-2d43ec6e2b3f' }
				});
				if (!response.ok) {
				throw new Error('Failed to get swap quote');
				}
				const transaction = await response.json();
				if (!transaction.calldata || !transaction.to) {
				throw new Error('Invalid swap transaction response');
				}
				const swapTx = {
				from: address,
				to: transaction.to,
				data: transaction.calldata,
				value: fromToken.address.toLowerCase() === NATIVE_TOKEN.toLowerCase() ? amountInDecimals : '0x0',
				gasPrice: transaction.gas_price,
				};
				const swapHash = await window.ethereum.request({
				method: 'eth_sendTransaction',
				params: [swapTx],
				});
				toast.success('Swap transaction submitted');
				// Monitor swap transaction
				let receipt = null, attempts = 0;
				while (!receipt && attempts < 30) {
				await new Promise(res => setTimeout(res, 2000));
				receipt = await window.ethereum.request({
					method: 'eth_getTransactionReceipt',
					params: [swapHash],
				});
				attempts++;
				}
				if (receipt && (receipt.status === '0x1' || receipt.status === 1)) {
				toast.success('Swap completed successfully!');
				onClose();
				} else {
				toast.error('Swap failed or timed out');
				}
				} catch (error: any) {
				console.error('Swap error:', error);
				toast.error(`Swap failed: ${error.message}`);
				} finally {
				setIsSwapping(false);
				}
				};

	const formatQuoteOutput = useCallback((q: Quote) => {
		if (!q || !toToken) return '';
		try {
			return formatUnits(BigInt(q.amount_out_total), toToken.decimals);
		} catch (error: any) {
			console.error('Format error:', error);
			return '0';
		}
	}, [toToken]);

	const convertibleTokens = tokens.filter(token => token.is_active);

	return (
		<Card className={`w-full max-w-4xl bg-gray-800 text-white ${className}`}>
			<CardHeader>
				<CardTitle>Changelly DEX</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{/* Chain Selector */}
					<div className="flex justify-center">
						<div className="relative">
							<button
								onClick={() => setShowChainSelector(!showChainSelector)}
								className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg"
							>
								{selectedChain.name}
								<ChevronDown size={20} />
							</button>
							{showChainSelector && (
								<div className="absolute left-0 right-0 mt-1 bg-blue-700 rounded-lg shadow-lg z-10">
									{SUPPORTED_CHAINS.map((chain) => (
										<button
											key={chain.id}
											onClick={() => {
												setSelectedChain(chain);
												setShowChainSelector(false);
											}}
											className="w-full text-left px-4 py-2 hover:bg-blue-800"
										>
											{chain.name}
										</button>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Token selectors and input */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block mb-2">From Token</label>
							<select 
								className="bg-gray-700 text-white p-2 rounded w-full"
								value={fromToken?.address || ''}
								onChange={e => setFromToken(tokens.find(t => t.address === e.target.value) || null)}
							>
								<option value="">Select token</option>
								{tokens.map((token, idx) => (
									<option key={`${token.address}-${idx}`} value={token.address}>
										{token.symbol} - {token.name}
									</option>
								))}
							</select>
							<label className="block mt-2">Amount</label>
							<input
								type="number"
								value={amount}
								onChange={e => setAmount(e.target.value)}
								className="bg-gray-700 text-white p-2 rounded w-full"
								placeholder="Enter amount"
								min="0"
							/>
						</div>
						<div>
							<label className="block mb-2">To Token</label>
							<select 
								className="bg-gray-700 text-white p-2 rounded w-full"
								value={toToken?.address || ''}
								onChange={e => setToToken(tokens.find(t => t.address === e.target.value) || null)}
							>
								<option value="">Select token</option>
								{convertibleTokens.map((token, idx) => (
									<option key={`${token.address}-${idx}`} value={token.address}>
										{token.symbol} - {token.name}
									</option>
								))}
							</select>
						</div>
					</div>

					{/* Quote & Info Display */}
					{quote && (
						<div className="bg-gray-700 p-4 rounded-lg">
							<p className="text-lg">
								You will receive: {formatQuoteOutput(quote)} {toToken?.symbol}
							</p>
							<p className="text-gray-400">Gas estimate: {quote.estimate_gas_total}</p>
						</div>
					)}
					{!address ? (
						<ConnectButton />
					) : (
						<button 
							onClick={handleSwap}
							disabled={loading || !quote || isSwapping}
							className="w-full px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
						>
							{isSwapping ? 'Swapping...' : 'Swap'}
						</button>
					)}
				</div>
			</CardContent>
		</Card>
	);
};

export default ChangellyDEX;
async function getApprovalTransaction(tokenAddress: string, amountInDecimals: string) {
	try {
		const params = new URLSearchParams({
			tokenAddress: tokenAddress,
			amount: amountInDecimals,
		});

		const response = await fetch(`/api/v1/approval?${params.toString()}`, {
			headers: {
				'X-Api-Key': '57d18ecb-7f0e-456c-a085-2d43ec6e2b3f',
				'Accept': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error('Failed to get approval transaction');
		}

		const data = await response.json();
		
		if (!data.to || !data.calldata || !data.gas_price) {
			throw new Error('Invalid approval transaction response');
		}

		return {
			to: data.to,
			calldata: data.calldata,
			gas_price: data.gas_price
		};
	} catch (error) {
		console.error('Approval transaction error:', error);
		throw error;
	}
}

async function checkAllowance(tokenAddress: string, amountInDecimals: string): Promise<boolean> {
	try {
		const params = new URLSearchParams({
			tokenAddress: tokenAddress,
			amount: amountInDecimals,
		});

		const response = await fetch(`/api/v1/allowance?${params.toString()}`, {
			headers: {
				'X-Api-Key': '57d18ecb-7f0e-456c-a085-2d43ec6e2b3f',
				'Accept': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error('Failed to check allowance');
		}

		const data = await response.json();
		return data.hasAllowance || false;

	} catch (error) {
		console.error('Allowance check error:', error);
		return false;
	}
}

