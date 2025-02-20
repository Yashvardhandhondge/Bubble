import { useState, useEffect } from 'react';
import { WagmiConfig } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { wagmiConfig } from './config/payment';
import { Toaster } from 'react-hot-toast';
import PaymentVerification from './components/PaymentVerification';

import { Navbar } from './components/Navbar';
import ChartAdapter from './components/ChartAdapter';
import { BuySignalsPanel } from './components/BuySignalsPanel';
import { Wget } from './components/Chart';
import { CryptoData } from './types';
import '@rainbow-me/rainbowkit/styles.css';
import { DataProvider } from './context/DataContext';
import SimplifiedLayout from './components/SimplifiedLayout';
import { MobileNavbar } from './components/MobileNavbar';
import { ViewContainer } from './components/ViewContainer';
import { ViewType } from './types';

function App() {
  const [selectedRange, setSelectedRange] = useState("Top 100");
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoData | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentView, setCurrentView] = useState<ViewType>('chart');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Check initial size

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function handleBubbleClick(crypto: CryptoData): void {
    setSelectedCrypto(crypto);
  }

  // Mobile View
  if (isMobile) {
    return (
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider modalSize="compact">
          <DataProvider>
            <Router>
              <div className="h-screen bg-black md:bg-gray-900 relative">
                <MobileNavbar 
                  currentView={currentView}
                  onViewChange={setCurrentView}
                />
                <ViewContainer 
                  currentView={currentView} 
                  selectedRange={selectedRange} 
                  setSelectedRange={setSelectedRange} 
                />
              </div>
              <Toaster />
            </Router>
          </DataProvider>
        </RainbowKitProvider>
      </WagmiConfig>
    );
  }

  // Desktop View
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider modalSize="compact">
        <DataProvider>
          <Router>
            <Toaster />
            <PaymentVerification />
            <Routes>
              <Route path="/" element={
                <SimplifiedLayout rightPanel={<BuySignalsPanel />}>
                  <div className="flex-1 flex flex-col">
                    <Navbar onRangeChange={setSelectedRange} />
                    <div className="flex-1 p-6">
                      <div className="w-full h-full">
                        <ChartAdapter 
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