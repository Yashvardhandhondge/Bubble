import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

// Add SignalData to the types
interface SignalData {
  symbol: string;
  description: string;
  timestamp?: number;
  risks: string[];
  // ... other signal properties
}

interface CryptoData {
  symbol: string;
  risk: number;
  icon: string;
  price: number;
  volume: number;
  moralisLink: string;
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
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Modify the provider props to accept isPremium
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

  const isMounted = useRef(false);
  const [isPremium, setIsPremium] = useState(() => 
    localStorage.getItem('premium_status') === 'active'
  );
  const [currentToken, setCurrentToken] = useState<string>("binance"); // new token state

  // Add a retry mechanism
  const fetchWithRetry = async (url: string, retries = 3): Promise<Response> => {
    for (let i = 0; i < retries; i++) {
      // console.log("Fetching data...", i);
      
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

  // Add a helper to build endpoints based on currentToken
  const getSignalsEndpoint = () => {
    if (currentToken === "btcc") return "https://api.coinchart.fun/dex_signals/btcc";
    if (currentToken === "cookiefun") return "https://api.coinchart.fun/dex_signals/cookiefun";
    return "https://api.coinchart.fun/dex_signals/binance";
  };

  useEffect(() => {
    let isSubscribed = true;
    let intervalId: NodeJS.Timeout | null = null;

    const fetchAllData = async () => {
      try {
        // Use dynamic endpoint based on currentToken
        const risksResponse = await fetchWithRetry(`https://api.coinchart.fun/dex_risks/${currentToken}`);
        const signalsResponse = await fetchWithRetry(getSignalsEndpoint());

        if (!isSubscribed) return;

        // Process risks data - handle text directly before parsing
        let risksText = await risksResponse.text();
        
        try {
          // More aggressive sanitization for NaN, Infinity, and undefined values
          // We need to handle all these cases explicitly to avoid JSON parsing errors
          
          // Replace NaN with null directly in the string
          risksText = risksText.replace(/([{,]\s*"[^"]+"\s*:\s*)NaN/g, '$1null');
          
          // Replace Infinity and -Infinity
          risksText = risksText.replace(/([{,]\s*"[^"]+"\s*:\s*)Infinity/g, '$1null');
          risksText = risksText.replace(/([{,]\s*"[^"]+"\s*:\s*)-Infinity/g, '$1null');
          
          // Replace undefined
          risksText = risksText.replace(/([{,]\s*"[^"]+"\s*:\s*)undefined/g, '$1null');
          
          // Log a small portion of the sanitized JSON for debugging
          // console.log("Sanitized JSON sample:", risksText.substring(0, 100) + "...");
          
          // Parse the sanitized JSON
          const risksResult = JSON.parse(risksText);
          
          // Process signals data
          let signalsData = [];
          try {
            signalsData = await signalsResponse.json();
          } catch (signalError) {
            console.error("Error parsing signals:", signalError);
            signalsData = []; // Fallback to empty array if signals parsing fails
          }

          // Transform and set data with extra safety checks
          const transformedRisksData = Object.entries(risksResult)
            .map(([key, value]: [string, any]) => {
              // Default values for each field with explicit conversions and safety checks
              return {
                symbol: key,
                risk: typeof value.risk === 'number' && !isNaN(value.risk) ? value.risk : 50,
                icon: value.icon || `https://coinchart.fun/icons/${key}.png`,
                price: typeof value.price === 'number' && !isNaN(value.price) ? value.price : 0,
                volume: typeof value.volume === 'number' && !isNaN(value.volume) ? value.volume : 0,
                moralisLink: value.moralisLink || "#",
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

          // console.log(`Processed ${transformedRisksData.length} crypto items`);

          // Sort signals if any
          const sortedSignals = (signalsData as any[]).sort(
            (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
          );

          setData(transformedRisksData);
          setFilteredData(transformedRisksData);
          setSignals(sortedSignals);
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
            // console.error(`JSON error context: "...${errorContext}..."`);
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
                  warnings: [],
                  "1mChange": 0,
                  "2wChange": 0,
                  "3mChange": 0,
                  bubbleSize: Math.random() * 0.5 + 0.5
                });
              }
            }
            
            if (tokens.length > 0) {
              // console.log(`Fallback: Extracted ${tokens.length} tokens`);
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
        // console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    // Always fetch data when currentToken changes
    fetchAllData();
    
    // Set up interval for periodic updates - removed for now
    // intervalId = setInterval(fetchAllData, 60000); // Every minute

    // Cleanup function
    return () => {
      isSubscribed = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [currentToken]);

  // Separate effect for filtering
  useEffect(() => {
    if (!data.length) return;

    const areFiltersActive = Object.values(filters).some(value => value === true);
    
    if (!areFiltersActive) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter(item => {
      if (!item.warnings || item.warnings.length === 0) return true;

      let shouldInclude = true;

      if (filters.skipPotentialTraps) {
        shouldInclude = shouldInclude && !item.warnings.some(w => 
          w.toLowerCase().includes("cycle is falling")
        );
      }

      if (filters.avoidOverhypedTokens) {
        shouldInclude = shouldInclude && !item.warnings.some(w => 
          w.toLowerCase().includes("cycle spent") && w.toLowerCase().includes("above 80")
        );
      }

      if (filters.marketCapFilter) {
        shouldInclude = shouldInclude && !item.warnings.some(w => 
          w.toLowerCase().includes("cycle has previously failed")
        );
      }

      return shouldInclude;
    });

    setFilteredData(filtered);
  }, [data, filters]);

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
      setCurrentToken
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