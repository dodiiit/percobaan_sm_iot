import { vi } from 'vitest';
import axios from 'axios';
import api from '../../services/api';

// Mock axios
vi.mock('axios', async () => {
  const actual = await vi.importActual('axios');
  return {
    ...actual,
    default: {
      create: vi.fn(() => ({
        interceptors: {
          request: {
            use: vi.fn(),
          },
          response: {
            use: vi.fn(),
          },
        },
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
      })),
    },
  };
});

describe('API Service', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
    
    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: '',
      },
      writable: true,
    });
  });
  
  test('axios.create is called with the correct baseURL', () => {
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: 'https://api.lingindustri.com/api',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  });
  
  test('request interceptor adds Authorization header when token exists', () => {
    // Get the request interceptor function
    const requestInterceptor = (axios.create as jest.Mock).mock.results[0].value.interceptors.request.use.mock.calls[0][0];
    
    // Mock localStorage.getItem to return a token
    (window.localStorage.getItem as jest.Mock).mockReturnValueOnce('test-token');
    
    // Create a mock config object
    const config = { headers: {} };
    
    // Call the interceptor
    const result = requestInterceptor(config);
    
    // Check that the Authorization header was added
    expect(result.headers.Authorization).toBe('Bearer test-token');
  });
  
  test('request interceptor does not add Authorization header when token does not exist', () => {
    // Get the request interceptor function
    const requestInterceptor = (axios.create as jest.Mock).mock.results[0].value.interceptors.request.use.mock.calls[0][0];
    
    // Mock localStorage.getItem to return null
    (window.localStorage.getItem as jest.Mock).mockReturnValueOnce(null);
    (window.sessionStorage.getItem as jest.Mock).mockReturnValueOnce(null);
    
    // Create a mock config object
    const config = { headers: {} };
    
    // Call the interceptor
    const result = requestInterceptor(config);
    
    // Check that the Authorization header was not added
    expect(result.headers.Authorization).toBeUndefined();
  });
  
  test('response interceptor handles 401 Unauthorized errors', () => {
    // Get the response error interceptor function
    const responseErrorInterceptor = (axios.create as jest.Mock).mock.results[0].value.interceptors.response.use.mock.calls[0][1];
    
    // Create a mock error object with a 401 response
    const error = {
      response: {
        status: 401,
      },
    };
    
    // Call the interceptor and catch the rejected promise
    expect.assertions(3);
    try {
      responseErrorInterceptor(error);
    } catch (e) {
      // Check that localStorage and sessionStorage were cleared
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('token');
      
      // Check that the user was redirected to the login page
      expect(window.location.href).toBe('/login');
    }
  });
  
  test('response interceptor handles 403 Forbidden errors', () => {
    // Get the response error interceptor function
    const responseErrorInterceptor = (axios.create as jest.Mock).mock.results[0].value.interceptors.response.use.mock.calls[0][1];
    
    // Create a mock error object with a 403 response
    const error = {
      response: {
        status: 403,
      },
    };
    
    // Call the interceptor and catch the rejected promise
    expect.assertions(1);
    try {
      responseErrorInterceptor(error);
    } catch (e) {
      // Check that the user was redirected to the unauthorized page
      expect(window.location.href).toBe('/unauthorized');
    }
  });
  
  test('response interceptor handles 500 Internal Server Error', () => {
    // Get the response error interceptor function
    const responseErrorInterceptor = (axios.create as jest.Mock).mock.results[0].value.interceptors.response.use.mock.calls[0][1];
    
    // Create a mock error object with a 500 response
    const error = {
      response: {
        status: 500,
      },
    };
    
    // Call the interceptor and catch the rejected promise
    expect.assertions(1);
    try {
      responseErrorInterceptor(error);
    } catch (e) {
      // Check that the user was redirected to the server error page
      expect(window.location.href).toBe('/server-error');
    }
  });
});