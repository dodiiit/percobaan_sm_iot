export const CONFIG = {
  API_URL:
    (typeof window !== 'undefined' && (window as any).env?.REACT_APP_API_URL)
      || (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL)
      || (typeof process !== 'undefined' && (process as any).env?.REACT_APP_API_URL)
      || (typeof location !== 'undefined' && location.protocol === 'https:'
            ? 'https://api.lingindustri.com/api'
            : 'http://localhost:8000/api'),
};

export default CONFIG;
