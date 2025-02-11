import React, { useEffect, useState } from 'react';
import BitcoinRiskChart from './BubbleChart2';
import { CryptoData } from '../types';
import { useData } from '../context/DataContext';

interface ChartAdapterProps {
  selectedRange: string;
  onBubbleClick: (crypto: CryptoData) => void;
  isCollapsed?: boolean;
}

const ChartAdapter: React.FC<ChartAdapterProps> = ({
  selectedRange,
  onBubbleClick,
  isCollapsed
}) => {
  const { loading } = useData();
  const [isReady, setIsReady] = useState(false);

  // Ensure component is mounted and data is loaded before rendering chart
  useEffect(() => {
    if (!loading) {
      // Small delay to ensure DOM is ready
      const timer = requestAnimationFrame(() => {
        setIsReady(true);
      });
      return () => cancelAnimationFrame(timer);
    }
  }, [loading]);

  const handleBubbleClick = (dataItem: any) => {
    try {
      const cryptoData: CryptoData = {
        id: dataItem.id || '',
        name: dataItem.name || '',
        marketCap: dataItem.marketCap || 0,
        volume24h: dataItem.volume24h || 0,
        percentChange: dataItem.percentChange || 0,
        rank: dataItem.rank || 0,
        riskLevel: dataItem.riskLevel || 0,
        symbol: dataItem.symbol || '',
        risk: dataItem.risk || 0,
        icon: dataItem.icon || '',
        price: dataItem.price || 0,
        volume: dataItem.volume || 0,
        moralisLink: dataItem.moralisLink || '',
        warnings: Array.isArray(dataItem.warnings) ? dataItem.warnings : [],
        '1mChange': dataItem['1mChange'] || 0,
        '2wChange': dataItem['2wChange'] || 0,
        '3mChange': dataItem['3mChange'] || 0,
        bubbleSize: dataItem.bubbleSize || 0
      };
      onBubbleClick(cryptoData);
    } catch (error) {
      console.error('Error processing bubble click:', error);
    }
  };

  // Show loading state
  if (!isReady || loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <BitcoinRiskChart
      selectedRange={selectedRange}
      onBubbleClick={handleBubbleClick}
      isCollapsed={isCollapsed}
    />
  );
};

// Add error boundary
class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center text-white">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap the ChartAdapter with error boundary
const ChartAdapterWithErrorBoundary: React.FC<ChartAdapterProps> = (props) => (
  <ChartErrorBoundary>
    <ChartAdapter {...props} />
  </ChartErrorBoundary>
);

export default ChartAdapterWithErrorBoundary;