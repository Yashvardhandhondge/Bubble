import React from 'react';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import PaymentVerification from './components/PaymentVerification';
import { config } from './config/payment';
import Navbar from './components/Navbar';
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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { FavoritesProvider } from './context/FavoritesContext';
const queryClient = new QueryClient();

function YourAppContent() {
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
      <DataProvider>
        <FavoritesProvider>
        <Router>
          <div className="h-screen bg-black md:bg-gray-900 relative">
            <MobileNavbar 
              onViewChange={setCurrentView} 
              currentView={currentView}
              selectedRange={selectedRange}
              onRangeRange={setSelectedRange}
            />
            <ViewContainer 
              currentView={currentView} 
              selectedRange={selectedRange}
              setSelectedRange={setSelectedRange}
            />
          </div>
          <Toaster />
        </Router>
        </FavoritesProvider>
      </DataProvider>
    );
  }

  // Desktop View
  return (
    <DataProvider>
      <FavoritesProvider>
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
      </FavoritesProvider>
    </DataProvider>
  );
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <YourAppContent />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;