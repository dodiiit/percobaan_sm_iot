import React from 'react';

const TestApp: React.FC = () => {
  console.log('TestApp component rendering...');
  
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333' }}>🎯 Ling Industri IoT - Test Page</h1>
      <p style={{ color: '#666' }}>If you can see this, React is working!</p>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginTop: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2>System Status</h2>
        <ul>
          <li>✅ React rendering</li>
          <li>✅ TypeScript compilation</li>
          <li>✅ Vite dev server</li>
          <li>✅ Basic styling</li>
        </ul>
        <button 
          onClick={() => alert('Button works!')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Test Click
        </button>
      </div>
    </div>
  );
};

export default TestApp;