export const CONFIG = {
  API_URL: (import.meta as any).env?.VITE_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
};

export default CONFIG;
