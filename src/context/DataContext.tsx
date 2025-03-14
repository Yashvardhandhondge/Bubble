import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

// Add SignalData to the types
interface SignalData {
  symbol: string;
  description: string;
  timestamp?: number;
  risks: string[];
  warnings: string[];
  warning_count: number;
  positives: string[];
  date: string;
  price: number;
  link: string;
  risk: number;
  risk_usdt: number;
}

interface CryptoData {
  symbol: string;
  risk: number;
  icon: string;
  price: number;
  volume: number;
  moralisLink: string;
  chainId: string;
  tokenAddress: string;
  name: string;
  warnings: string[];
  "1mChange": number;
  "2wChange": number;
  "3mChange": number;
  bubbleSize: number;
}

interface FilterSettings {
  skipPotentialTraps: boolean;
  avoidOverhypedTokens: boolean;
  marketCapFilter: boolean;
}

interface DataContextType {
  data: CryptoData[];
  signals: SignalData[];
  filteredData: CryptoData[];
  loading: boolean;
  error: string | null;
  filters: FilterSettings;
  updateFilters: (newFilters: Partial<FilterSettings>) => void;
  isPremium: boolean;
  setIsPremium: (status: boolean) => void;
  currentToken: string;
  setCurrentToken: (token: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  refreshSignals: () => void; // Added this function to manually refresh signals
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: React.ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [data, setData] = useState<CryptoData[]>([]);
  const [signals, setSignals] = useState<SignalData[]>([]);
  const [filteredData, setFilteredData] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterSettings>({
    skipPotentialTraps: false,
    avoidOverhypedTokens: false,
    marketCapFilter: false,
  });
  const [searchTerm, setSearchTerm] = useState<string>("");

  const isMounted = useRef(false);
  const [isPremium, setIsPremium] = useState(() => 
    localStorage.getItem('premium_status') === 'active'
  );
  const [currentToken, setCurrentToken] = useState<string>("binance");
  const signalsFetchedRef = useRef(false);

  const fetchWithRetry = async (url: string, retries = 3): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response;
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
      }
    }
    throw new Error('Failed to fetch after all retries');
  };

  const getSignalsEndpoint = () => {
    if (currentToken === "btcc") return "https://api.coinchart.fun/signals/btcc";
    if (currentToken === "cookiefun") return "https://api.coinchart.fun/signals/cookiefun";
    return "https://api.coinchart.fun/signals/binance";
  };

  // Function to fetch signals separately
  const fetchSignals = async () => {
    console.log("Fetching signals for:", currentToken, "Premium status:", isPremium);
    // Removed the early exit so that signals request always goes:
    // if (!isPremium) {
    //   console.log("Not premium, skipping signals fetch");
    //   setSignals([]);
    //   return;
    // }

    try {
      const endpoint = getSignalsEndpoint();
      console.log("Signals endpoint:", endpoint);
      
      const signalsResponse = await fetchWithRetry(endpoint);
      try {
        const signalsData = await signalsResponse.json();
        console.log("Signals data fetched:", signalsData.length, "items");
        
        // Sort signals by timestamp if available
        const sortedSignals = Array.isArray(signalsData) 
          ? signalsData.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
          : [];
          
        setSignals(sortedSignals);
        signalsFetchedRef.current = true;
      } catch (signalError) {
        console.error("Error parsing signals:", signalError);
        setSignals([]);
      }
    } catch (err) {
      console.error("Error fetching signals:", err);
      setSignals([]);
    }
  };

  // Add a function to manually refresh signals
  const refreshSignals = () => {
    fetchSignals();
  };

  // Effect to handle signals fetching whenever premium status or token changes
  useEffect(() => {
    fetchSignals();
  }, [isPremium, currentToken]);

  useEffect(() => {
    let isSubscribed = true;

    const fetchAllData = async () => {
      try {
        // Fetch the risks data
        const risksResponse = await fetchWithRetry(`https://api.coinchart.fun/risks/${currentToken}`);
        
        if (!isSubscribed) return;
        let risksText = await risksResponse.text();
        
        try {
          risksText = risksText
            .replace(/([{,]\s*"[^"]+"\s*:\s*)NaN/g, '$1null')
            .replace(/([{,]\s*"[^"]+"\s*:\s*)Infinity/g, '$1null')
            .replace(/([{,]\s*"[^"]+"\s*:\s*)-Infinity/g, '$1null')
            .replace(/([{,]\s*"[^"]+"\s*:\s*)undefined/g, '$1null');
          const risksResult = JSON.parse(risksText);
          
          // Transform and set data with extra safety checks and preserve chainId and tokenAddress
          const transformedRisksData = Object.entries(risksResult)
            .map(([key, value]: [string, any]) => {
              // Ensure we preserve the chainId and tokenAddress from the API
              return {
                symbol: key,
                risk: typeof value.risk === 'number' && !isNaN(value.risk) ? value.risk : 50,
                icon: value.icon || `https://coinchart.fun/icons/${key}.png`,
                price: typeof value.price === 'number' && !isNaN(value.price) ? value.price : 0,
                volume: typeof value.volume === 'number' && !isNaN(value.volume) ? value.volume : 0,
                moralisLink: value.moralisLink || "#",
                // Preserve the chainId and tokenAddress from the API
                chainId: value.chainId || "0x1", // Default to Ethereum if not provided
                tokenAddress: value.tokenAddress || "", // Keep empty string if not provided
                name: value.name || "",
                warnings: Array.isArray(value.warnings) ? value.warnings : [],
                "1mChange": typeof value["1mChange"] === 'number' && !isNaN(value["1mChange"]) ? value["1mChange"] : 0,
                "2wChange": typeof value["2wChange"] === 'number' && !isNaN(value["2wChange"]) ? value["2wChange"] : 0,
                "3mChange": typeof value["3mChange"] === 'number' && !isNaN(value["3mChange"]) ? value["3mChange"] : 0,
                bubbleSize: typeof value.bubbleSize === 'number' && !isNaN(value.bubbleSize) 
                  ? value.bubbleSize 
                  : Math.random() * 0.5 + 0.5 // Random value between 0.5 and 1
              };
            })
            .sort((a, b) => (b.volume || 0) - (a.volume || 0));

          setData(transformedRisksData);
          setFilteredData(transformedRisksData);
          setError(null);
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError);
          
          // Log more details about the failed JSON for debugging
          const errorPos = (parseError as any).message?.match(/position (\d+)/)?.[1];
          if (errorPos) {
            const errorContext = risksText.substring(
              Math.max(0, parseInt(errorPos) - 20),
              Math.min(risksText.length, parseInt(errorPos) + 20)
            );
            console.error(`JSON error context: "...${errorContext}..."`);
          }
          
          // Fallback to manually constructing data from the problematic JSON
          try {
            // Manual fallback - this is a desperate attempt if regex fails
            // Extract pairs like "Symbol": { ... } and construct valid objects
            const tokens: CryptoData[] = [];
            const tokenMatches = risksText.match(/"([^"]+)":\s*{[^}]*}/g) || [];
            
            for (const match of tokenMatches) {
              const symbolMatch = match.match(/"([^"]+)":/);
              if (symbolMatch && symbolMatch[1]) {
                const symbol = symbolMatch[1];
                tokens.push({
                  symbol,
                  risk: 50, // Default risk
                  icon: `https://coinchart.fun/icons/${symbol}.png`,
                  price: 0,
                  volume: Math.random() * 5000000,
                  moralisLink: "#",
                  chainId: "0x1", // Default to Ethereum
                  tokenAddress: "", // Empty string for fallback
                  name: "",
                  warnings: [],
                  "1mChange": 0,
                  "2wChange": 0,
                  "3mChange": 0,
                  bubbleSize: Math.random() * 0.5 + 0.5
                });
              }
            }
            
            if (tokens.length > 0) {
              console.log(`Fallback: Extracted ${tokens.length} tokens`);
              setData(tokens);
              setFilteredData(tokens);
              setError("Using fallback data due to API format issues");
            } else {
              throw new Error("Couldn't parse or extract any token data");
            }
          } catch (fallbackError) {
            setError(`JSON parsing failed completely: ${parseError instanceof Error ? parseError.message : "Unknown parsing error"}`);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    fetchAllData();
    
    return () => {
      isSubscribed = false;
    };
  }, [currentToken]);

  // Separate effect for filtering
  useEffect(() => {
    // Option 1: if you want no extra filtering:
    setFilteredData(data);
    
    // Option 2: if you want to apply searchTerm filtering only, use:
    // setFilteredData(searchTerm ? data.filter(item => item.symbol.toLowerCase().includes(searchTerm.toLowerCase())) : data);
  }, [data]);

  const updateFilters = (newFilters: Partial<FilterSettings>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return (
    <DataContext.Provider value={{
      data,
      signals,
      filteredData,
      loading,
      error,
      filters,
      updateFilters,
      isPremium,
      setIsPremium,
      currentToken,
      setCurrentToken,
      searchTerm,
      setSearchTerm,
      refreshSignals
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};