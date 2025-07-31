// Mock API service for demo purposes
// This service provides mock responses for the IndoWater application

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'client' | 'customer';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
}

interface MockLoginResponse {
  success: boolean;
  data: {
    token: string;
    user: MockUser;
  };
  message: string;
}

// Mock users database
const mockUsers: MockUser[] = [
  {
    id: '1',
    name: 'Super Administrator',
    email: 'superadmin@indowater.com',
    role: 'superadmin',
    status: 'active'
  },
  {
    id: '2',
    name: 'Client Manager',
    email: 'client@indowater.com',
    role: 'client',
    status: 'active'
  },
  {
    id: '3',
    name: 'Customer User',
    email: 'customer@indowater.com',
    role: 'customer',
    status: 'active'
  }
];

// Mock credentials
const mockCredentials = {
  'superadmin@indowater.com': 'password123',
  'client@indowater.com': 'password123',
  'customer@indowater.com': 'password123'
};

// Generate mock JWT token
const generateMockToken = (user: MockUser): string => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  // In a real app, this would be a proper JWT token
  // For demo purposes, we'll use base64 encoded JSON
  return btoa(JSON.stringify(payload));
};

// Mock API functions
export const mockApi = {
  // Mock login
  login: async (email: string, password: string): Promise<MockLoginResponse> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check credentials
    if (!mockCredentials[email as keyof typeof mockCredentials] || 
        mockCredentials[email as keyof typeof mockCredentials] !== password) {
      throw new Error('Invalid email or password');
    }
    
    // Find user
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Generate token
    const token = generateMockToken(user);
    
    return {
      success: true,
      data: {
        token,
        user
      },
      message: 'Login successful'
    };
  },
  
  // Mock get user profile
  getProfile: async (token: string): Promise<{ success: boolean; data: MockUser }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // Decode token (in real app, this would be proper JWT verification)
      const payload = JSON.parse(atob(token));
      const user = mockUsers.find(u => u.id === payload.id);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return {
        success: true,
        data: user
      };
    } catch (error) {
      throw new Error('Invalid token');
    }
  },
  
  // Mock logout
  logout: async (): Promise<{ success: boolean; message: string }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: 'Logout successful'
    };
  },
  
  // Mock dashboard data
  getDashboardData: async (role: string): Promise<any> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const baseData = {
      timestamp: new Date().toISOString(),
      role
    };
    
    switch (role) {
      case 'superadmin':
        return {
          ...baseData,
          stats: {
            totalClients: 25,
            totalProperties: 150,
            totalCustomers: 1250,
            totalMeters: 2100,
            totalRevenue: 125000000,
            serviceFees: 5500000,
            activeClients: 23,
            pendingClients: 2
          },
          recentClients: [
            { id: 1, name: 'PT Aqua Mandiri', status: 'active', createdAt: '2024-01-15' },
            { id: 2, name: 'CV Water Solutions', status: 'pending', createdAt: '2024-01-14' },
            { id: 3, name: 'PT Tirta Sejahtera', status: 'active', createdAt: '2024-01-13' }
          ],
          recentPayments: [
            { id: 1, client: 'PT Aqua Mandiri', amount: 2500000, date: '2024-01-15' },
            { id: 2, client: 'CV Water Solutions', amount: 1800000, date: '2024-01-14' },
            { id: 3, client: 'PT Tirta Sejahtera', amount: 3200000, date: '2024-01-13' }
          ]
        };
        
      case 'client':
        return {
          ...baseData,
          stats: {
            totalProperties: 12,
            totalCustomers: 85,
            totalMeters: 120,
            totalRevenue: 8500000,
            activeCustomers: 82,
            pendingCustomers: 3
          },
          recentCustomers: [
            { id: 1, name: 'John Doe', property: 'Apartment A-101', status: 'active' },
            { id: 2, name: 'Jane Smith', property: 'House B-205', status: 'pending' },
            { id: 3, name: 'Bob Johnson', property: 'Villa C-301', status: 'active' }
          ],
          recentPayments: [
            { id: 1, customer: 'John Doe', amount: 150000, date: '2024-01-15' },
            { id: 2, customer: 'Jane Smith', amount: 200000, date: '2024-01-14' },
            { id: 3, customer: 'Bob Johnson', amount: 175000, date: '2024-01-13' }
          ]
        };
        
      case 'customer':
        return {
          ...baseData,
          stats: {
            totalMeters: 2,
            totalConsumption: 45.5,
            totalPayments: 850000,
            currentBalance: 125000,
            lastReading: '2024-01-15',
            lastPayment: '2024-01-10'
          },
          meters: [
            { id: 1, location: 'Main House', reading: 1234.5, status: 'active' },
            { id: 2, location: 'Garden', reading: 567.8, status: 'active' }
          ],
          recentPayments: [
            { id: 1, amount: 150000, date: '2024-01-10', method: 'Bank Transfer' },
            { id: 2, amount: 200000, date: '2023-12-15', method: 'Credit Card' },
            { id: 3, amount: 175000, date: '2023-11-20', method: 'Bank Transfer' }
          ]
        };
        
      default:
        return baseData;
    }
  }
};

// Check if we should use mock API (for demo/development)
export const shouldUseMockApi = (): boolean => {
  // Use mock API if:
  // 1. REACT_APP_USE_MOCK_API is set to 'true'
  // 2. No API URL is configured
  // 3. We're in development mode and can't reach the real API
  
  return process.env.REACT_APP_USE_MOCK_API === 'true' || 
         !process.env.REACT_APP_API_URL ||
         process.env.NODE_ENV === 'development';
};