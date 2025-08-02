/**
 * Cached API wrapper for API services
 * Provides caching for API responses
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import cacheService, { CacheConfig, CacheStorage } from './CacheService';
import { getApiUrl } from '../utils/environment';

export interface CachedApiConfig {
  baseURL?: string;
  cacheConfig?: Partial<CacheConfig>;
  headers?: Record<string, string>;
}

export class CachedApi {
  private api: AxiosInstance;
  private cacheConfig: Partial<CacheConfig>;

  constructor(config: CachedApiConfig = {}) {
    const { baseURL = getApiUrl(), cacheConfig = {}, headers = {} } = config;

    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    this.cacheConfig = {
      storage: CacheStorage.MEMORY,
      ttl: 5 * 60 * 1000, // 5 minutes default TTL
      ...cacheConfig,
    };
  }

  /**
   * Generate a cache key for a request
   * @param method HTTP method
   * @param url Request URL
   * @param params Request parameters
   * @param data Request data
   * @returns Cache key
   */
  private generateCacheKey(
    method: string,
    url: string,
    params?: any,
    data?: any
  ): string {
    return `${method}:${url}:${JSON.stringify(params || {})}:${JSON.stringify(
      data || {}
    )}`;
  }

  /**
   * Make a cached API request
   * @param config Request configuration
   * @param cacheConfig Cache configuration
   * @returns Promise with response data
   */
  async request<T = any>(
    config: AxiosRequestConfig,
    cacheConfig?: Partial<CacheConfig>
  ): Promise<AxiosResponse<T>> {
    const { method = 'GET', url = '', params, data } = config;
    
    if (!url) {
      throw new Error('URL is required');
    }

    // Only cache GET requests
    if (method.toUpperCase() === 'GET') {
      const cacheKey = this.generateCacheKey(method, url, params, data);
      const cachedData = cacheService.get<AxiosResponse<T>>(
        cacheKey,
        { ...this.cacheConfig, ...cacheConfig }
      );

      if (cachedData) {
        return cachedData;
      }

      const response = await this.api.request<T>(config);
      
      cacheService.set(
        cacheKey,
        response,
        { ...this.cacheConfig, ...cacheConfig }
      );
      
      return response;
    }

    // Non-GET requests are not cached
    return this.api.request<T>(config);
  }

  /**
   * Make a GET request
   * @param url Request URL
   * @param params Request parameters
   * @param config Request configuration
   * @param cacheConfig Cache configuration
   * @returns Promise with response data
   */
  async get<T = any>(
    url: string,
    params?: any,
    config?: AxiosRequestConfig,
    cacheConfig?: Partial<CacheConfig>
  ): Promise<AxiosResponse<T>> {
    return this.request<T>(
      {
        method: 'GET',
        url,
        params,
        ...config,
      },
      cacheConfig
    );
  }

  /**
   * Make a POST request
   * @param url Request URL
   * @param data Request data
   * @param config Request configuration
   * @returns Promise with response data
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({
      method: 'POST',
      url,
      data,
      ...config,
    });
  }

  /**
   * Make a PUT request
   * @param url Request URL
   * @param data Request data
   * @param config Request configuration
   * @returns Promise with response data
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({
      method: 'PUT',
      url,
      data,
      ...config,
    });
  }

  /**
   * Make a PATCH request
   * @param url Request URL
   * @param data Request data
   * @param config Request configuration
   * @returns Promise with response data
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({
      method: 'PATCH',
      url,
      data,
      ...config,
    });
  }

  /**
   * Make a DELETE request
   * @param url Request URL
   * @param config Request configuration
   * @returns Promise with response data
   */
  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({
      method: 'DELETE',
      url,
      ...config,
    });
  }
}

// Export a singleton instance
export default new CachedApi();