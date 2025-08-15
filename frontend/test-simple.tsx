import React from 'react';
import ReactDOM from 'react-dom/client';

const SimpleApp: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', textAlign: 'center' }}>
        🚀 Ling Industri IoT
      </h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '2rem', opacity: 0.9 }}>
        Frontend Test Successful!
      </h2>
      
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '2rem',
        borderRadius: '15px',
        backdropFilter: 'blur(10px)',
        maxWidth: '600px',
        textAlign: 'center'
      }}>
        <p style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
          ✅ React is working correctly
        </p>
        <p style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
          ✅ TypeScript compilation successful
        </p>
        <p style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
          ✅ Vite dev server running
        </p>
        <p style={{ marginBottom: '2rem', fontSize: '1.1rem' }}>
          ✅ Environment: {process.env.NODE_ENV || 'development'}
        </p>
        
        <button
          onClick={() => {
            console.log('Button clicked! React events working.');
            alert('React events are working! 🎉');
          }}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Test React Events
        </button>
      </div>
      
      <div style={{
        marginTop: '2rem',
        fontSize: '0.9rem',
        opacity: 0.7,
        textAlign: 'center'
      }}>
        <p>Current URL: {window.location.href}</p>
        <p>Timestamp: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

// Get root element
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// Render app
try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<SimpleApp />);
  console.log('🎯 Simple React app rendered successfully!');
} catch (error) {
  console.error('Failed to render React app:', error);
  rootElement.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; background-color: #dc2626; color: white; font-family: Inter, system-ui, sans-serif;">
      <h1>❌ React Render Failed</h1>
      <p>Error: ${error}</p>
      <button onclick="window.location.reload()" style="padding: 12px 24px; background-color: white; color: #dc2626; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; margin-top: 16px;">
        Refresh Page
      </button>
    </div>
  `;
}