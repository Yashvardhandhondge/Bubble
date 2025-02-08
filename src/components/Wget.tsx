import React, { useEffect } from 'react';

export const Wget = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadWidget = () => {
      if (typeof window.createTokenWget === 'function') {
        window.createTokenWget('token-widget-container', {
          chainId: '0x1',
          tokenAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
        });
      } else {
        console.error('createTokenWget function is not defined.');
      }
    };

    if (!document.getElementById('moralis-token-widget')) {
      const script = document.createElement('script');
      script.id = 'moralis-token-widget';
      script.src = 'https://moralis.com/static/embed/token.js';
      script.type = 'text/javascript';
      script.async = true;
      script.onload = loadWidget;
      script.onerror = () => {
        console.error('Failed to load the chart widget script.');
      };
      document.body.appendChild(script);
    } else {
      loadWidget();
    }
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div id="token-widget-container" style={{ width: '100%', height: '100%' }} />
    </div>
  );
};


