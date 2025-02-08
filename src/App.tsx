import  { useState } from 'react';
import { WagmiConfig } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { wagmiConfig, chains } from './config/payment';
import { Navbar } from './components/Navbar';
import ResizableLayout from './components/Resizablecomponent';
import BitcoinRiskChart from './components/BubbleChart2';
import { BuySignalsPanel } from './components/BuySignalsPanel';
import { Wget } from './components/Chart';
import { useNavigate, useLocation } from 'react-router-dom';

import { CryptoData } from './types';
// import PaymentModal from './components/PaymentModal';
import '@rainbow-me/rainbowkit/styles.css';
import { DataProvider } from './context/DataContext';









// Main App Component
function App() {
  const [selectedRange, setSelectedRange] = useState("Top 100");
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData | null>(null);

 

  function handleBubbleClick(crypto: CryptoData): void {
    setSelectedCrypto(crypto);
  }

  return (
    <WagmiConfig config={wagmiConfig}>
      {/* @ts-ignore */}
      <RainbowKitProvider chains={chains}>
        <DataProvider>
          <Router>
            <Routes>
              <Route path="/" element={
                <ResizableLayout rightPanel={<BuySignalsPanel />}>
                  <div className="flex-1 flex flex-col">
                    <Navbar onRangeChange={setSelectedRange} />
                    <div className="flex-1 p-6">
                      <div className="w-full h-full">
                        <BitcoinRiskChart 
                          selectedRange={selectedRange}
                          onBubbleClick={(crypto: CryptoData) => handleBubbleClick(crypto)}
                          // isCollapsed will be injected by ResizableLayout
                        />
                        {selectedCrypto && (
                          <Wget onClose={() => setSelectedCrypto(null)}/>
                        )}
                      </div>
                    </div>
                  </div>
                </ResizableLayout>
              } />
              
            </Routes>
          </Router>
        </DataProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

export default App;