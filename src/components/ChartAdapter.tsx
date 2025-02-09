import React from 'react';
import BitcoinRiskChart from './BubbleChart2';
import { CryptoData } from '../types';

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
  const handleBubbleClick = (dataItem: any) => {
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
      warnings: dataItem.warnings || [],
      '1mChange': dataItem['1mChange'] || 0,
      '2wChange': dataItem['2wChange'] || 0,
      '3mChange': dataItem['3mChange'] || 0,
      bubbleSize: dataItem.bubbleSize || 0
    };
    onBubbleClick(cryptoData);
  };

  return (
    <BitcoinRiskChart
      selectedRange={selectedRange}
      onBubbleClick={handleBubbleClick}
      isCollapsed={isCollapsed}
    />
  );
};

export default ChartAdapter;