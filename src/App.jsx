import React, { useState } from 'react';
import { Browser } from '@capacitor/browser';

function App() {
  const [url, setUrl] = useState('');

  const openUrl = async (targetUrl) => {
    if (!targetUrl) return;
    let formatted = targetUrl.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = `https://${formatted}`;
    }
    try {
      await Browser.open({ url: formatted });
    } catch (e) {
      window.open(formatted, '_blank');
    }
  };

  const shortcuts = [
    { name: 'Google', url: 'https://www.google.com' },
    { name: 'YouTube', url: 'https://www.youtube.com' },
    { name: 'GitHub', url: 'https://www.github.com' },
    { name: 'Wikipedia', url: 'https://www.wikipedia.org' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0b0f19',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '8px', color: '#6366f1' }}>
        NEXORA JH
      </h1>
      <p style={{ color: '#9ca3af', marginBottom: '32px' }}>
        O teu navegador moderno e seguro
      </p>

      <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '400px', marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="www.google.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && openUrl(url)}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid #1e293b',
            backgroundColor: '#111827',
            color: '#fff',
            outline: 'none'
          }}
        />
        <button
          onClick={() => openUrl(url)}
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            border: 'none',
            backgroundColor: '#6366f1',
            color: '#fff',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Ir
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', maxWidth: '400px' }}>
        {shortcuts.map((sc) => (
          <button
            key={sc.name}
            onClick={() => openUrl(sc.url)}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#1f2937',
              color: '#d1d5db',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            {sc.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;
