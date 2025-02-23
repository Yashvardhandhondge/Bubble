import React, { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useChainId, useSwitchChain } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { ConnectButton } from '@rainbow-me/rainbowkit';
// import { GasService } from '../services/GasService';
// import { ChangellyService } from '../services/Changelly2';
import { GasSpeed } from '../types/changelly';
import { ChangellyService } from '../services/ChangellyService';
import { GasPrices } from '../types/changelly';
import { GasService } from '../services/Gasprice';
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

const API_KEY = '57d18ecb-7f0e-456c-a085-2d43ec6e2b3f';
const NATIVE_TOKEN = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const WRAPPED_TOKEN_MAPPING: Record<number, string> = {
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
	const [selectedGasPrice, setSelectedGasPrice] = useState<'low' | 'medium' | 'high'>('low');
	const [selectedGasSpeed, setSelectedGasSpeed] = useState<GasSpeed>('low');
	const [gasPrices, setGasPrices] = useState<GasPrices | null>(null);
	const [estimatedCost, setEstimatedCost] = useState<number>(0);

	const loadTokens = async (chainId: number) => {
		try {
			const response = await fetch(`/api/${chainId}/tokens`, {
				method: 'GET',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				}
			});
		
			if (!response.ok) {
				throw new Error(`Failed to load tokens: ${response.status}`);
			}
		
			const data = await response.json();
			console.log('Tokens response:', data);
			return Array.isArray(data) ? data : data.tokens || [];
		} catch (error) {
			console.error('Token loading error:', error);
			throw error;
		}
	};
	
	// Update useEffect for token loading
	useEffect(() => {
		const fetchTokens = async () => {
			try {
				setLoading(true);
				const tokenList = await loadTokens(selectedChain.id);
				setTokens(tokenList);
				if (tokenList.length > 0) {
					const nativeToken: Token | undefined = tokenList.find((t: Token): boolean => t.address.toLowerCase() === NATIVE_TOKEN.toLowerCase());
					setFromToken(nativeToken || tokenList[0]);
					setToToken(tokenList[0]);
				}
			} catch (error: any) {
				console.error('Failed to load tokens:', error);
				toast.error('Failed to load tokens');
			} finally {
				setLoading(false);
			}
			};
		
			fetchTokens();
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
			
			const quote = await ChangellyService.getQuote(
				selectedChain.id,
				fromToken,
				toToken,
				amountInDecimals,
				address,
				selectedGasSpeed
			);
	
			setQuote(quote);

			// Calculate estimated gas cost
			if (quote.estimate_gas_total && gasPrices?.[selectedGasSpeed]) {
				const estimatedCost = GasService.getEstimatedCost(
					quote.estimate_gas_total,
					gasPrices[selectedGasSpeed],
					1 // TODO: Add native token price here
				);
				setEstimatedCost(estimatedCost);
			}
		} catch (error: any) {
			console.error('Quote error:', error);
			toast.error(`Failed to get quote: ${error.message}`);
			setQuote(null);
			setEstimatedCost(0);
		} finally {
			setLoading(false);
		}
	}, [fromToken, toToken, amount, selectedChain.id, address, selectedGasSpeed, gasPrices]);
	
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

	const checkAllowance = async (tokenAddress: string, walletAddress: string, chainId: number): Promise<boolean> => {
		try {
			const params = new URLSearchParams({
				tokenAddress,
				walletAddress
			});
		
			const response = await fetch(
				 `/api/${chainId}/transaction/allowance?${params}`,
				{
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					}
				}
			);
		
			if (!response.ok) {
				throw new Error('Failed to check allowance');
			}
		
			const data = await response.json();
			console.log('Allowance response:', data);
			return BigInt(data.remaining || '0') > 0n;
		} catch (error) {
			console.error('Allowance check error:', error);
			return false;
		}
	};
	
	const getApprovalTransaction = async (tokenAddress: string, amount: string, chainId: number): Promise<any> => {
		try {
			const params = new URLSearchParams({
				tokenAddress,
				amount,
				gasPrice: '16000000000'
			});
		
			const response = await fetch(
				 `/api/${chainId}/transaction/approve?${params}`,
				{
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					}
				}
			);
		
			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Approval error: ${errorText}`);
			}
		
			const data = await response.json();
			console.log('Approval transaction:', data);
			return data;
		} catch (error) {
			console.error('Get approval transaction error:', error);
			throw error;
		}
	};
	
	// Updated fetchGasPrices function:
	const fetchGasPrices = async (chainId: number): Promise<Record<'low' | 'medium' | 'high', string>> => {
		try {
			// Call the external API directly.
			const response = await fetch(`https://dex-api.changelly.com/v1/${chainId}/gasprices`, {
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				}
			});
			if (!response.ok) {
				throw new Error('Failed to fetch gas prices');
			}
			const data = await response.json();
			// Convert gas price from GWEI to WEI (1 GWEI = 1e9 WEI)
			return {
				low: Math.floor(parseFloat(data.low) * 1e9).toString(),
				medium: Math.floor(parseFloat(data.medium) * 1e9).toString(),
				high: Math.floor(parseFloat(data.high) * 1e9).toString(),
			};
		} catch (error) {
			console.error('Failed to fetch gas prices:', error);
			toast.error('Failed to fetch gas prices');
			// Fallback value (e.g., 2 GWEI)
			return { low: '2000000000', medium: '2000000000', high: '2000000000' };
		}
	};

	useEffect(() => {
		const fetchGasPrices = async () => {
			try {
				const prices = await GasService.getGasPrices(selectedChain.id);
				setGasPrices(prices);
				
				// Auto-select recommended speed
				const recommendedSpeed = await GasService.getRecommendedSpeed(selectedChain.id);
				setSelectedGasSpeed(recommendedSpeed);
			} catch (error) {
				console.error('Failed to fetch gas prices:', error);
				toast.error('Failed to fetch gas prices');
			}
		};
	
		fetchGasPrices();
	}, [selectedChain.id]);

	// Update handleSwap function
	const handleSwap = async () => {
		if (!fromToken || !toToken || !amount || !address) {
			toast.error('Please fill all fields and connect wallet');
			return;
			}
		
			try {
			setIsSwapping(true);
			
			// Switch chain if needed
			if (chainId !== selectedChain.id) {
				await switchChain({ chainId: selectedChain.id });
				await new Promise(resolve => setTimeout(resolve, 1000));
			}
		
			const amountInDecimals = parseUnits(amount, fromToken.decimals).toString();
			const mappedFromToken = mapTokenAddress(fromToken.address, selectedChain.id);
		
			// Check allowance for non-native tokens
			if (mappedFromToken.toLowerCase() !== NATIVE_TOKEN.toLowerCase()) {
				const hasAllowance = await checkAllowance(
				mappedFromToken,
				address,
				selectedChain.id
				);
		
				if (!hasAllowance) {
				const approvalTx = await getApprovalTransaction(
					mappedFromToken,
					amountInDecimals,
					selectedChain.id
				);
		
				console.log('Approval transaction data:', approvalTx);
		
				const approvalHash = await window.ethereum.request({
					method: 'eth_sendTransaction',
					params: [{
					from: address,
					to: approvalTx.to,
					data: approvalTx.calldata,
					gasPrice: approvalTx.gas_price,
					}]
				});
		
				toast.success('Approval transaction submitted');
		
				// Wait for approval confirmation
				let receipt = null;
				while (!receipt) {
					await new Promise(resolve => setTimeout(resolve, 2000));
					receipt = await window.ethereum.request({
					method: 'eth_getTransactionReceipt',
					params: [approvalHash]
					});
				}
		
				if (receipt.status !== '0x1') {
					throw new Error('Approval failed');
				}
				
				toast.success('Approval confirmed');
				}
			}
		
			// Get swap quote
			const params = new URLSearchParams({
				fromTokenAddress: mappedFromToken,
				toTokenAddress: mapTokenAddress(toToken.address, selectedChain.id),
				amount: amountInDecimals,
				slippage: '1',
				gasPrice: '100000',
				feeRecipient: address,
				buyTokenPercentageFee: '1'
			});
		
			const response = await fetch(
				`https://dex-api.changelly.com/v1/${selectedChain.id}/quote?${params}`,
				{ headers: { 'X-Api-Key': API_KEY } }
			);
		
			if (!response.ok) {
				throw new Error('Failed to get swap quote');
			}
		
			const quote = await response.json();
			console.log('Swap quote:', quote);
		
			// Execute swap
			const swapTx = {
				from: address,
				to: quote.to,
				data: quote.calldata,
				value: fromToken.address.toLowerCase() === NATIVE_TOKEN.toLowerCase() ? amountInDecimals : '0x0',
				gasPrice: quote.gas_price
			};
		
			const swapHash = await window.ethereum.request({
				method: 'eth_sendTransaction',
				params: [swapTx]
			});
		
			toast.success('Swap transaction submitted');
		
			// Monitor swap transaction
			let receipt = null;
			while (!receipt) {
				await new Promise(resolve => setTimeout(resolve, 2000));
				receipt = await window.ethereum.request({
				method: 'eth_getTransactionReceipt',
				params: [swapHash]
				});
			}
		
			if (receipt.status === '0x1') {
				toast.success('Swap completed successfully!');
				onClose();
			} else {
				throw new Error('Swap failed');
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

	// Add gas speed selector UI
	const renderGasSpeedSelector = () => (
		<div className="space-y-2">
			<label className="block text-sm font-medium">Gas Price</label>
			<div className="grid grid-cols-3 gap-2">
				{(['low', 'medium', 'high'] as const).map((speed) => (
					<button
						key={speed}
						onClick={() => setSelectedGasSpeed(speed)}
						className={`p-2 rounded ${
							selectedGasSpeed === speed ? 'bg-blue-600' : 'bg-gray-700'
						}`}
					>
						<div className="text-sm font-medium">
							{speed.charAt(0).toUpperCase() + speed.slice(1)}
						</div>
						{gasPrices && (
							<div className="text-xs">
								{GasService.formatGasPrice(gasPrices[speed])}
							</div>
						)}
					</button>
				))}
			</div>
			{quote && (
				<div className="text-sm text-gray-400 mt-1">
					Estimated gas: {quote.estimate_gas_total} @ {
						gasPrices?.[selectedGasSpeed] || '0'
					} GWEI
				</div>
			)}
		</div>
	);
	
	const renderGasInfo = () => {
		if (!quote || !gasPrices || !fromToken) return null;
	
		const isNativeToken = fromToken.address.toLowerCase() === NATIVE_TOKEN.toLowerCase();
		const amountInDecimals = parseUnits(amount || '0', fromToken.decimals).toString();
	
		const { gasCost, totalCost } = GasService.calculateGasForTransaction(
			selectedChain.id,
			quote.estimate_gas_total,
			gasPrices[selectedGasSpeed],
			amountInDecimals,
			isNativeToken
		);
	
		return (
		  <div className="text-sm text-gray-400 mt-1">
			<p>Gas Limit: {parseInt(quote.estimate_gas_total).toLocaleString()} units</p>
			<p>Gas Price: {GasService.formatGasDisplay(selectedChain.id, gasPrices[selectedGasSpeed])}</p>
			<p>Network Fee: {formatUnits(BigInt(gasCost), 18)} {selectedChain.shortname}</p>
			{isNativeToken && (
			  <p>Total Cost: {formatUnits(BigInt(totalCost), 18)} {selectedChain.shortname}</p>
			)}
		  </div>
		);
	  };

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

					{/* Add gas speed selector */}
					{renderGasSpeedSelector()}

					{/* Quote & Info Display */}
					{quote && (
						<div className="bg-gray-700 p-4 rounded-lg">
							<p className="text-lg">
								You will receive: {formatQuoteOutput(quote)} {toToken?.symbol}
							</p>
							{renderGasInfo()}
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

