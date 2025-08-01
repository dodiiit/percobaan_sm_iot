import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import * as serviceWorker from './serviceWorker';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// Register service worker for offline capabilities and faster loading
// Only register in production to avoid caching issues during development
if (process.env.NODE_ENV === 'production') {
  serviceWorker.register({
    onSuccess: () => console.log('Service worker registered successfully'),
    onUpdate: (registration) => {
      // Notify user of new content
      const updateButton = document.createElement('button');
      updateButton.className = 'fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg';
      updateButton.textContent = 'Update Available';
      updateButton.addEventListener('click', () => {
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
      document.body.appendChild(updateButton);
    }
  });
} else {
  serviceWorker.unregister();
}