import { useState } from 'react';
import { WagmiConfig } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { wagmiConfig, chains } from './config/payment';
import { Navbar } from './components/Navbar';
import BitcoinRiskChart from './components/BubbleChart2';
import { BuySignalsPanel } from './components/BuySignalsPanel';
import { Wget } from './components/Chart';
import { CryptoData } from './types';
import '@rainbow-me/rainbowkit/styles.css';
import { DataProvider } from './context/DataContext';
import SimplifiedLayout from './components/SimplifiedLayout';

function App() {
  const [selectedRange, setSelectedRange] = useState("Top 100");
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData | null>(null);

  function handleBubbleClick(crypto: CryptoData): void {
    setSelectedCrypto(crypto);
  }

  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <DataProvider>
          <Router>
            <Routes>
              <Route path="/" element={
                <SimplifiedLayout rightPanel={<BuySignalsPanel />}>
                  <div className="flex-1 flex flex-col">
                    <Navbar onRangeChange={setSelectedRange} />
                    <div className="flex-1 p-6">
                      <div className="w-full h-full">
                        <BitcoinRiskChart 
                          selectedRange={selectedRange}
                          onBubbleClick={handleBubbleClick}
                        />
                        {selectedCrypto && (
                          <Wget onClose={() => setSelectedCrypto(null)}/>
                        )}
                      </div>
                    </div>
                  </div>
                </SimplifiedLayout>
              } />
            </Routes>
          </Router>
        </DataProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

export default App;