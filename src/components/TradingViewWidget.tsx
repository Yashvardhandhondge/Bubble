import React, { useEffect, useRef, memo } from 'react';

function TradingViewWidget({ symbol = 'BTCUSDT' }: { symbol?: string }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clean up any existing scripts to prevent duplication
    if (container.current) {
      const existingScript = container.current.querySelector('script');
      if (existingScript) {
        existingScript.remove();
      }
    }

    // Always add USDT to the symbol if not already present
    const upperSymbol = symbol.toUpperCase();
    const tokenSymbol = upperSymbol.endsWith('USDT') ? upperSymbol : `${upperSymbol}USDT`;
    const formattedSymbol = `BINANCE:${tokenSymbol}`;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "autosize": true,
        "symbol": "${formattedSymbol}",
        "interval": "D",
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "enable_publishing": false,
        "allow_symbol_change": true,
        "calendar": false,
        "hide_volume": false,
        "support_host": "https://www.tradingview.com"
      }`;
    container.current.appendChild(script);

    // Cleanup function
    return () => {
      if (container.current) {
        const script = container.current.querySelector('script');
        if (script) {
          script.remove();
        }
      }
    };
  }, [symbol]);

  return (
    <div className="tradingview-widget-container" ref={container} style={{ height: "100%", width: "100%" }}>
      <div className="tradingview-widget-container__widget" style={{ height: "calc(100% - 32px)", width: "100%" }}></div>
      <div className="tradingview-widget-copyright" style={{ fontSize: "11px", lineHeight: "32px", textAlign: "center" }}>
        <a 
          href={`https://www.tradingview.com/symbols/${symbol}USDT`} 
          rel="noopener nofollow" 
          target="_blank" 
          style={{ color: "#3BB3E4", textDecoration: "none" }}
        >
          <span className="blue-text">Track {symbol} on TradingView</span>
        </a>
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);