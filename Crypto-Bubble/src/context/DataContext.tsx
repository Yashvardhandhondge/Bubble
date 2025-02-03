import React, { createContext, useContext, useState, useEffect } from 'react';

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
  filteredData: CryptoData[];
  loading: boolean;
  error: string | null;
  filters: FilterSettings;
  updateFilters: (newFilters: Partial<FilterSettings>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<CryptoData[]>([]);
  const [filteredData, setFilteredData] = useState<CryptoData[]>(data);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterSettings>({
    skipPotentialTraps: false,
    avoidOverhypedTokens: false,
    marketCapFilter: false,
  });

  // Modify the fetch effect to initialize filteredData
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://3.75.231.25/dex_risks");
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const responseText = await response.text();
        const sanitizedResponseText = responseText.replace(/NaN/g, "null");
        const result = JSON.parse(sanitizedResponseText);

        const transformedData = Object.entries(result).map(([key, value]: [string, any]) => ({
          symbol: key,
          risk: value.risk,
          icon: value.icon,
          price: value.price,
          volume: value.volume || 0,
          moralisLink: value.moralisLink,
          warnings: value.warnings || [],
          "1mChange": value["1mChange"],
          "2wChange": value["2wChange"],
          "3mChange": value["3mChange"],
          bubbleSize: value.bubbleSize
        })).sort((a, b) => (b.volume || 0) - (a.volume || 0));

        setData(transformedData);
        // Initialize filteredData with the full dataset
        setFilteredData(transformedData);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
        setLoading(false);
      }
    };

    fetchData();
    
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

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

  // Remove the filterData useMemo as we're now using useEffect

  const updateFilters = (newFilters: Partial<FilterSettings>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return (
    <DataContext.Provider value={{
      data,
      filteredData,
      loading,
      error,
      filters,
      updateFilters
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