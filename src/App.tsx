import React, { useState } from 'react';

export default function App() {
  const [url, setUrl] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    alert(`A aceder a: ${url}`);
  };

  return (
    <div style={{
      backgroundColor: '#0B0F19',
      color: '#F3F4F6',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
      padding: '20px'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          background: 'linear-gradient(to right, #3B82F6, #8B5CF6)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent', 
          margin: 0 
        }}>
          NEXORA JH
        </h1>
        <p style={{ color: '#9CA3AF', fontSize: '0.9rem', marginTop: '8px' }}>O teu navegador moderno e seguro</p>
      </div>

      <form onSubmit={handleSearch} style={{ width: '100%', maxWidth: '400px', display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Pesquisar ou escrever endereço..."
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid #1F2937',
            backgroundColor: '#111827',
            color: '#FFF',
            outline: 'none',
            fontSize: '1rem'
          }}
        />
        <button type="submit" style={{
          padding: '12px 20px',
          borderRadius: '12px',
          border: 'none',
          background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
          color: '#FFF',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}>Ir</button>
      </form>

      <div style={{ display: 'flex', gap: '15px', marginTop: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {['Google', 'YouTube', 'GitHub', 'Wikipedia'].map((site) => (
          <button key={site} onClick={() => alert(`Atalho: ${site}`)} style={{
            padding: '8px 16px',
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#D1D5DB',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}>
            {site}
          </button>
        ))}
      </div>
    </div>
  );
}
