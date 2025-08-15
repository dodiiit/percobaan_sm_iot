import React from 'react';
import ReactDOM from 'react-dom/client';

const MinimalApp: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🚀 Ling Industri IoT - Minimal React Test</h1>
      <p>✅ React is working!</p>
      <p>✅ TypeScript is working!</p>
      <p>✅ Vite dev server is working!</p>
      <button onClick={() => alert('Click works!')}>Test Button</button>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(rootElement);
root.render(<MinimalApp />);