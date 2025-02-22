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
	const fetchQuote = useCallback(async () => {
		if (!fromToken || !toToken || !amount || parseFloat(amount) <= 0 || !address) {
			setQuote(null);
			return;
		}
		try {
			setLoading(true);
			const amountInDecimals = parseUnits(amount, fromToken.decimals).toString();
			const params = new URLSearchParams({
				fromTokenAddress: fromToken.address,
				toTokenAddress: toToken.address,
				amount: amountInDecimals,
				slippage: '10',
				gasPrice: '16000000000',
				recipientAddress: address,
				takerAddress: address,
				skipValidation: 'true'
			});
			const response = await fetch(`/api/v1/${selectedChain.id}/quote?${params.toString()}`, {
				headers: { 'X-Api-Key': '57d18ecb-7f0e-456c-a085-2d43ec6e2b3f' }
			});
			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}
			// Read response as text first
			const responseText = await response.text();
			if (!responseText) {
				throw new Error("Empty response received");
			}
			const data: Quote = JSON.parse(responseText);
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
			const params = new URLSearchParams({
				fromTokenAddress: fromToken.address,
				toTokenAddress: toToken.address,
				amount: amountInDecimals,
				slippage: '10',
				gasPrice: '16000000000',
				recipientAddress: address,
				takerAddress: address,
				skipValidation: 'true'
			});
			const response = await fetch(`/api/v1/${selectedChain.id}/quote?${params.toString()}`, {
				headers: { 'X-Api-Key': '57d18ecb-7f0e-456c-a085-2d43ec6e2b3f' }
			});
			if (!response.ok) {
				throw new Error('Failed to get swap transaction');
			}
			const transaction = await response.json();
			if (!transaction.calldata || !transaction.to) {
				throw new Error('Invalid swap transaction response');
			}
			const { hash } = await window.ethereum.request({
				method: 'eth_sendTransaction',
				params: [{
					from: address,
					to: transaction.to,
					data: transaction.calldata,
					value: fromToken.address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
						? amountInDecimals
						: '0x0',
					gasPrice: transaction.gas_price,
				}],
			});
			toast.success('Transaction submitted');
			const receipt = await window.ethereum.request({
				method: 'eth_getTransactionReceipt',
				params: [hash],
			});
			// Adjust receipt status check if necessary
			if (receipt?.status === '0x1' || receipt?.status === 1) {
				toast.success('Swap completed successfully!');
				onClose();
			} else {
				toast.error('Swap failed');
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

	// Filter tokens to only include the active ones
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

					{/* Action Button / Wallet Connect */}
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