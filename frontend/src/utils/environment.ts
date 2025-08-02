/**
 * Environment utility to safely access environment variables
 * This centralizes all environment variable access and provides type-safe defaults
 */

// Define environment variable types
interface EnvironmentVariables {
  NODE_ENV: 'development' | 'production' | 'test';
  REACT_APP_API_URL: string;
  REACT_APP_USE_MOCK_API: string;
  REACT_APP_CACHE_ENABLED: string;
}

// Default values for environment variables
const defaultEnv: EnvironmentVariables = {
  NODE_ENV: 'development',
  REACT_APP_API_URL: 'https://api.indowater.com',
  REACT_APP_USE_MOCK_API: 'false',
  REACT_APP_CACHE_ENABLED: 'true',
};

/**
 * Get environment variable with type safety
 * @param key The environment variable key
 * @returns The environment variable value or its default
 */
export function getEnv<K extends keyof EnvironmentVariables>(key: K): EnvironmentVariables[K] {
  // Use window.env for runtime configuration if available (useful for containerized deployments)
  const windowEnv = (window as any).env;
  
  if (windowEnv && windowEnv[key] !== undefined) {
    return windowEnv[key];
  }
  
  // Use import.meta.env for Vite
  try {
    // Map our environment variable names to Vite's naming convention
    const viteKey = key.replace('REACT_APP_', 'VITE_');
    const viteEnv = (import.meta as any).env?.[viteKey];
    if (viteEnv !== undefined) {
      return viteEnv;
    }
  } catch (e) {
    // Ignore errors when import.meta is not available
  }
  
  // Fallback to process.env if available
  try {
    // @ts-ignore - process might not be available in browser
    const processEnv = process?.env?.[key];
    if (processEnv !== undefined) {
      // Cast to the expected type
      return processEnv as EnvironmentVariables[K];
    }
  } catch (e) {
    // Ignore errors when process is not available
  }
  
  // Return default value as fallback
  return defaultEnv[key];
}

/**
 * Check if the current environment is development
 */
export const isDevelopment = (): boolean => getEnv('NODE_ENV') === 'development';

/**
 * Check if the current environment is production
 */
export const isProduction = (): boolean => getEnv('NODE_ENV') === 'production';

/**
 * Check if the current environment is test
 */
export const isTest = (): boolean => getEnv('NODE_ENV') === 'test';

/**
 * Check if mock API should be used
 */
export const useMockApi = (): boolean => getEnv('REACT_APP_USE_MOCK_API') === 'true';

/**
 * Check if caching is enabled
 */
export const isCacheEnabled = (): boolean => getEnv('REACT_APP_CACHE_ENABLED') === 'true';

/**
 * Get the API URL
 */
export const getApiUrl = (): string => getEnv('REACT_APP_API_URL');