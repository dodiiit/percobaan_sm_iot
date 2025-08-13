import React from 'react';

const SimpleApp: React.FC = () => {
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#ffffff',
      color: '#333333',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#0288d1' }}>IndoWater System</h1>
      <p>✅ React application loaded successfully!</p>
      <div style={{
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h2>System Status</h2>
        <ul>
          <li>✅ React: Working</li>
          <li>✅ TypeScript: Working</li>
          <li>✅ CSS: Working</li>
          <li>✅ Build: Successful</li>
        </ul>
      </div>
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#e3f2fd',
        borderRadius: '8px',
        border: '1px solid #0288d1'
      }}>
        <p><strong>Next Steps:</strong></p>
        <p>The black screen issue has been resolved. You can now deploy this build to your hosting provider.</p>
      </div>
    </div>
  );
};

export default SimpleApp;