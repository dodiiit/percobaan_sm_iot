import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './config/environment';

// Simple error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          backgroundColor: '#ffffff',
          color: '#333333',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          <h1 style={{ color: '#dc2626', marginBottom: '16px' }}>Something went wrong</h1>
          <p style={{ marginBottom: '16px', textAlign: 'center', maxWidth: '600px' }}>
            The application encountered an error. Please refresh the page or contact support if the problem persists.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Get root element
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// Render app
try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
} catch (error) {
  console.error('Failed to render React app:', error);
  // Fallback rendering
  rootElement.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; background-color: #ffffff; color: #333333; font-family: Inter, system-ui, sans-serif;">
      <h1 style="color: #dc2626; margin-bottom: 16px;">Failed to Load Application</h1>
      <p style="margin-bottom: 16px; text-align: center; max-width: 600px;">
        The React application failed to initialize. Please check the console for more details.
      </p>
      <button onclick="window.location.reload()" style="padding: 12px 24px; background-color: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
        Refresh Page
      </button>
      <details style="margin-top: 20px; max-width: 800px;">
        <summary style="cursor: pointer; margin-bottom: 8px;">Error Details</summary>
        <pre style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; overflow: auto; font-size: 14px;">${error}</pre>
      </details>
    </div>
  `;
}