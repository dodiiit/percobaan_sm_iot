import React, { useState, useEffect, Fragment } from 'react';
import { 
  UsersIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  UserPlusIcon,
  UserMinusIcon,
  ShieldCheckIcon,
  FunnelIcon,
  ChevronDownIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { toast } from 'react-toastify';
import api from '../../../services/api';
import { mockApi, shouldUseMockApi } from '../../../services/mockApi';
import PageHeader from '../../../components/common/PageHeader';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'client' | 'customer' | 'staff';
  status: 'active' | 'inactive' | 'suspended';
  last_login?: string;
  created_at: string;
  client_id?: string;
  client_name?: string;
  permissions?: string[];
}

interface Client {
  id: string;
  name: string;
}

// User Form Component
interface UserFormProps {
  user: User | null;
  clients: Client[];
  onSubmit: (userData: Partial<User>) => void;
  onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, clients, onSubmit, onCancel }) => {
  const isEditMode = !!user?.id;
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'staff',
    status: 'active',
    client_id: '',
    permissions: []
  });
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        ...user,
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value as User['role'];
    setFormData(prev => ({ 
      ...prev, 
      role,
      // Clear client_id if role is superadmin or admin
      client_id: (role === 'superadmin' || role === 'admin') ? undefined : prev.client_id
    }));
  };

  const handlePermissionChange = (permission: string) => {
    setFormData(prev => {
      const currentPermissions = prev.permissions || [];
      if (currentPermissions.includes(permission)) {
        return {
          ...prev,
          permissions: currentPermissions.filter(p => p !== permission)
        };
      } else {
        return {
          ...prev,
          permissions: [...currentPermissions, permission]
        };
      }
    });
  };

  const validateForm = () => {
    // Password validation for new users
    if (!isEditMode) {
      if (!password) {
        setPasswordError('Password is required');
        return false;
      }
      if (password.length < 8) {
        setPasswordError('Password must be at least 8 characters');
        return false;
      }
      if (password !== confirmPassword) {
        setPasswordError('Passwords do not match');
        return false;
      }
    }

    // Client validation for client and customer roles
    if ((formData.role === 'client' || formData.role === 'customer' || formData.role === 'staff') && !formData.client_id) {
      toast.error('Please select a client');
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const userData = { ...formData };
    
    // Add password only for new users
    if (!isEditMode && password) {
      Object.assign(userData, { password });
    }

    onSubmit(userData);
  };

  // Define available permissions based on role
  const getAvailablePermissions = () => {
    switch (formData.role) {
      case 'superadmin':
        return [
          'manage_all',
          'view_analytics',
          'manage_clients',
          'manage_users',
          'manage_system',
          'manage_billing'
        ];
      case 'admin':
        return [
          'view_analytics',
          'manage_clients',
          'manage_users',
          'manage_system',
          'manage_billing'
        ];
      case 'client':
        return [
          'manage_customers',
          'manage_meters',
          'manage_properties',
          'view_reports',
          'manage_staff',
          'manage_billing'
        ];
      case 'staff':
        return [
          'view_customers',
          'view_meters',
          'view_properties',
          'view_reports',
          'manage_meters',
          'manage_properties'
        ];
      case 'customer':
        return [
          'view_usage',
          'view_bills',
          'make_payments'
        ];
      default:
        return [];
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Full Name
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="name"
              id="name"
              required
              value={formData.name || ''}
              onChange={handleChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
            />
          </div>
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email Address
          </label>
          <div className="mt-1">
            <input
              type="email"
              name="email"
              id="email"
              required
              value={formData.email || ''}
              onChange={handleChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
            />
          </div>
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Role
          </label>
          <div className="mt-1">
            <select
              id="role"
              name="role"
              value={formData.role || 'staff'}
              onChange={handleRoleChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
            >
              <option value="superadmin">Superadmin</option>
              <option value="admin">Admin</option>
              <option value="client">Client Admin</option>
              <option value="staff">Client Staff</option>
              <option value="customer">Customer</option>
            </select>
          </div>
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Status
          </label>
          <div className="mt-1">
            <select
              id="status"
              name="status"
              value={formData.status || 'active'}
              onChange={handleChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {(formData.role === 'client' || formData.role === 'customer' || formData.role === 'staff') && (
          <div className="sm:col-span-6">
            <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Client
            </label>
            <div className="mt-1">
              <select
                id="client_id"
                name="client_id"
                value={formData.client_id || ''}
                onChange={handleChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
              >
                <option value="">Select a client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {!isEditMode && (
          <>
            <div className="sm:col-span-3">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                  }}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  id="confirmPassword"
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError('');
                  }}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                />
              </div>
            </div>
          </>
        )}

        {passwordError && (
          <div className="sm:col-span-6">
            <p className="text-sm text-red-600">{passwordError}</p>
          </div>
        )}

        <div className="sm:col-span-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Permissions
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {getAvailablePermissions().map(permission => (
              <div key={permission} className="flex items-center">
                <input
                  id={`permission-${permission}`}
                  name={`permission-${permission}`}
                  type="checkbox"
                  checked={(formData.permissions || []).includes(permission)}
                  onChange={() => handlePermissionChange(permission)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={`permission-${permission}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  {permission.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {isEditMode ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
};

// Reset Password Form Component
interface ResetPasswordFormProps {
  userId: string;
  userName: string;
  onSubmit: (userId: string, newPassword: string) => void;
  onCancel: () => void;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ userId, userName, onSubmit, onCancel }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setPasswordError('Password is required');
      return;
    }
    
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    onSubmit(userId, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Resetting password for <span className="font-medium text-gray-900 dark:text-white">{userName}</span>
        </p>
      </div>
      
      <div>
        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          New Password
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <input
            type={showPassword ? "text" : "password"}
            name="new-password"
            id="new-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError('');
            }}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md pr-10"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <EyeIcon className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
      </div>
      
      <div>
        <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Confirm New Password
        </label>
        <div className="mt-1">
          <input
            type={showPassword ? "text" : "password"}
            name="confirm-new-password"
            id="confirm-new-password"
            required
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setPasswordError('');
            }}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
          />
        </div>
      </div>
      
      {passwordError && (
        <div>
          <p className="text-sm text-red-600">{passwordError}</p>
        </div>
      )}
      
      <div className="flex justify-end space-x-3">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Reset Password
        </Button>
      </div>
    </form>
  );
};

// Main Component
const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof User>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchUsers();
    fetchClients();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, roleFilter, statusFilter, clientFilter, sortField, sortDirection]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      let response;
      
      if (shouldUseMockApi()) {
        // Use mock data
        response = {
          data: {
            status: 'success',
            data: [
              {
                id: 'user-001',
                name: 'John Admin',
                email: 'john@example.com',
                role: 'superadmin',
                status: 'active',
                last_login: '2025-07-30T08:30:00Z',
                created_at: '2025-01-15T00:00:00Z',
                permissions: ['manage_all', 'view_analytics', 'manage_clients', 'manage_users', 'manage_system', 'manage_billing']
              },
              {
                id: 'user-002',
                name: 'Jane Manager',
                email: 'jane@example.com',
                role: 'admin',
                status: 'active',
                last_login: '2025-07-29T14:20:00Z',
                created_at: '2025-02-10T00:00:00Z',
                permissions: ['view_analytics', 'manage_clients', 'manage_users', 'manage_billing']
              },
              {
                id: 'user-003',
                name: 'Bob Client',
                email: 'bob@waterco.com',
                role: 'client',
                status: 'active',
                last_login: '2025-07-28T09:15:00Z',
                created_at: '2025-03-05T00:00:00Z',
                client_id: 'client-001',
                client_name: 'Jakarta Water Co',
                permissions: ['manage_customers', 'manage_meters', 'manage_properties', 'view_reports', 'manage_staff']
              },
              {
                id: 'user-004',
                name: 'Alice Staff',
                email: 'alice@waterco.com',
                role: 'staff',
                status: 'active',
                last_login: '2025-07-27T11:45:00Z',
                created_at: '2025-03-20T00:00:00Z',
                client_id: 'client-001',
                client_name: 'Jakarta Water Co',
                permissions: ['view_customers', 'view_meters', 'manage_meters', 'view_properties']
              },
              {
                id: 'user-005',
                name: 'Charlie Customer',
                email: 'charlie@gmail.com',
                role: 'customer',
                status: 'active',
                last_login: '2025-07-26T18:30:00Z',
                created_at: '2025-04-10T00:00:00Z',
                client_id: 'client-001',
                client_name: 'Jakarta Water Co',
                permissions: ['view_usage', 'view_bills', 'make_payments']
              },
              {
                id: 'user-006',
                name: 'Dave Operator',
                email: 'dave@bandungwater.com',
                role: 'staff',
                status: 'inactive',
                last_login: '2025-06-15T10:20:00Z',
                created_at: '2025-04-25T00:00:00Z',
                client_id: 'client-002',
                client_name: 'Bandung Water Services',
                permissions: ['view_customers', 'view_meters', 'view_properties']
              },
              {
                id: 'user-007',
                name: 'Eve Support',
                email: 'eve@example.com',
                role: 'admin',
                status: 'suspended',
                last_login: '2025-05-20T09:10:00Z',
                created_at: '2025-05-05T00:00:00Z',
                permissions: ['view_analytics', 'manage_clients']
              }
            ]
          }
        };
      } else {
        // Use real API
        response = await api.get('/users');
      }
      
      if (response.data.status === 'success') {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      let response;
      
      if (shouldUseMockApi()) {
        // Use mock data
        response = {
          data: {
            status: 'success',
            data: [
              { id: 'client-001', name: 'Jakarta Water Co' },
              { id: 'client-002', name: 'Bandung Water Services' },
              { id: 'client-003', name: 'Surabaya Hydro Solutions' },
              { id: 'client-004', name: 'Bali Water Management' }
            ]
          }
        };
      } else {
        // Use real API
        response = await api.get('/clients');
      }
      
      if (response.data.status === 'success') {
        setClients(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients. Please try again.');
    }
  };

  const applyFilters = () => {
    let result = [...users];
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(user => 
        user.name.toLowerCase().includes(lowerSearchTerm) || 
        user.email.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(user => user.status === statusFilter);
    }
    
    // Apply client filter
    if (clientFilter !== 'all') {
      result = result.filter(user => user.client_id === clientFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      const fieldA = a[sortField] || '';
      const fieldB = b[sortField] || '';
      
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortDirection === 'asc' 
          ? fieldA.localeCompare(fieldB)
          : fieldB.localeCompare(fieldA);
      }
      
      return 0;
    });
    
    setFilteredUsers(result);
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setUserToResetPassword(user);
    setIsResetPasswordModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setLoading(true);
      
      if (shouldUseMockApi()) {
        // Mock delete
        setTimeout(() => {
          setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));
          toast.success(`User ${userToDelete.name} has been deleted.`);
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
          setLoading(false);
        }, 500);
      } else {
        // Real API call
        const response = await api.delete(`/users/${userToDelete.id}`);
        
        if (response.data.status === 'success') {
          setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));
          toast.success(`User ${userToDelete.name} has been deleted.`);
        }
        
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user. Please try again.');
    } finally {
      if (!shouldUseMockApi()) {
        setLoading(false);
      }
    }
  };

  const handleUserSubmit = async (userData: Partial<User>) => {
    try {
      setLoading(true);
      
      if (shouldUseMockApi()) {
        // Mock API call
        setTimeout(() => {
          if (selectedUser) {
            // Update existing user
            setUsers(prevUsers => 
              prevUsers.map(user => 
                user.id === selectedUser.id 
                  ? { ...user, ...userData, client_name: getClientName(userData.client_id) }
                  : user
              )
            );
            toast.success(`User ${userData.name} has been updated.`);
          } else {
            // Create new user
            const newUser: User = {
              id: `user-${Date.now()}`,
              name: userData.name || '',
              email: userData.email || '',
              role: userData.role as User['role'] || 'staff',
              status: userData.status as User['status'] || 'active',
              created_at: new Date().toISOString(),
              client_id: userData.client_id,
              client_name: getClientName(userData.client_id),
              permissions: userData.permissions || []
            };
            
            setUsers(prevUsers => [...prevUsers, newUser]);
            toast.success(`User ${userData.name} has been created.`);
          }
          
          setIsModalOpen(false);
          setSelectedUser(null);
          setLoading(false);
        }, 500);
      } else {
        // Real API call
        let response;
        
        if (selectedUser) {
          // Update existing user
          response = await api.put(`/users/${selectedUser.id}`, userData);
        } else {
          // Create new user
          response = await api.post('/users', userData);
        }
        
        if (response.data.status === 'success') {
          fetchUsers(); // Refresh the user list
          toast.success(`User ${userData.name} has been ${selectedUser ? 'updated' : 'created'}.`);
        }
        
        setIsModalOpen(false);
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(`Failed to ${selectedUser ? 'update' : 'create'} user. Please try again.`);
    } finally {
      if (!shouldUseMockApi()) {
        setLoading(false);
      }
    }
  };

  const handleResetPasswordSubmit = async (userId: string, newPassword: string) => {
    try {
      setLoading(true);
      
      if (shouldUseMockApi()) {
        // Mock API call
        setTimeout(() => {
          toast.success('Password has been reset successfully.');
          setIsResetPasswordModalOpen(false);
          setUserToResetPassword(null);
          setLoading(false);
        }, 500);
      } else {
        // Real API call
        const response = await api.post(`/users/${userId}/reset-password`, { password: newPassword });
        
        if (response.data.status === 'success') {
          toast.success('Password has been reset successfully.');
        }
        
        setIsResetPasswordModalOpen(false);
        setUserToResetPassword(null);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password. Please try again.');
    } finally {
      if (!shouldUseMockApi()) {
        setLoading(false);
      }
    }
  };

  const getClientName = (clientId?: string) => {
    if (!clientId) return undefined;
    const client = clients.find(c => c.id === clientId);
    return client?.name;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getRoleBadgeColor = (role: User['role']) => {
    switch (role) {
      case 'superadmin':
        return 'red';
      case 'admin':
        return 'purple';
      case 'client':
        return 'blue';
      case 'staff':
        return 'green';
      case 'customer':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getStatusBadgeColor = (status: User['status']) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'gray';
      case 'suspended':
        return 'red';
      default:
        return 'gray';
    }
  };

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field: keyof User) => {
    if (sortField !== field) {
      return <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />;
    }
    
    return sortDirection === 'asc' 
      ? <ChevronDownIcon className="h-4 w-4 text-blue-500" />
      : <ChevronDownIcon className="h-4 w-4 text-blue-500 rotate-180" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="User Management"
        description="Manage system users and their permissions"
        actions={
          <Button onClick={handleCreateUser} icon={<UserPlusIcon className="h-5 w-5 mr-2" />}>
            Add User
          </Button>
        }
      />

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 min-w-0">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="Search users by name or email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <select
                className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="superadmin">Superadmin</option>
                <option value="admin">Admin</option>
                <option value="client">Client Admin</option>
                <option value="staff">Staff</option>
                <option value="customer">Customer</option>
              </select>
              
              <select
                className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
              
              <select
                className="block w-full sm:w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
              >
                <option value="all">All Clients</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                  setClientFilter('all');
                }}
                icon={<ArrowPathIcon className="h-4 w-4 mr-2" />}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          {loading && users.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No users found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' || clientFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating a new user.'}
              </p>
              <div className="mt-6">
                <Button onClick={handleCreateUser} icon={<UserPlusIcon className="h-5 w-5 mr-2" />}>
                  Add User
                </Button>
              </div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Name</span>
                      {renderSortIcon('name')}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Email</span>
                      {renderSortIcon('email')}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Role</span>
                      {renderSortIcon('role')}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {renderSortIcon('status')}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('client_name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Client</span>
                      {renderSortIcon('client_name')}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('last_login')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Last Login</span>
                      {renderSortIcon('last_login')}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <span className="text-blue-600 dark:text-blue-300 font-medium text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Created {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge color={getRoleBadgeColor(user.role)} size="sm">
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge color={getStatusBadgeColor(user.status)} size="sm">
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {user.client_name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(user.last_login)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          title="Edit User"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(user)}
                          className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300"
                          title="Reset Password"
                        >
                          <KeyIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          title="Delete User"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* User Form Modal */}
      <Transition.Root show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="fixed z-10 inset-0 overflow-y-auto" onClose={() => setIsModalOpen(false)}>
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900">
                    <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      {selectedUser ? 'Edit User' : 'Create New User'}
                    </Dialog.Title>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6">
                  <UserForm
                    user={selectedUser}
                    clients={clients}
                    onSubmit={handleUserSubmit}
                    onCancel={() => setIsModalOpen(false)}
                  />
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Delete Confirmation Modal */}
      <Transition.Root show={isDeleteModalOpen} as={Fragment}>
        <Dialog as="div" className="fixed z-10 inset-0 overflow-y-auto" onClose={() => setIsDeleteModalOpen(false)}>
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                    <UserMinusIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Delete User
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete the user "{userToDelete?.name}"? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <Button
                    variant="danger"
                    onClick={confirmDeleteUser}
                    className="w-full sm:w-auto sm:ml-3"
                  >
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="mt-3 w-full sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Reset Password Modal */}
      <Transition.Root show={isResetPasswordModalOpen} as={Fragment}>
        <Dialog as="div" className="fixed z-10 inset-0 overflow-y-auto" onClose={() => setIsResetPasswordModalOpen(false)}>
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900">
                    <KeyIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Reset Password
                    </Dialog.Title>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6">
                  {userToResetPassword && (
                    <ResetPasswordForm
                      userId={userToResetPassword.id}
                      userName={userToResetPassword.name}
                      onSubmit={handleResetPasswordSubmit}
                      onCancel={() => setIsResetPasswordModalOpen(false)}
                    />
                  )}
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
};

export default UserManagement;