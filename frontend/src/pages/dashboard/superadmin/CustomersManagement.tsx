import React, { useState, useEffect } from 'react';
import { 
  UserIcon, 
  PlusIcon, 
  MagnifyingGlassIcon, 
  PencilIcon, 
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PhoneIcon,
  EnvelopeIcon,
  HomeIcon,
  CpuChipIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../../components/common/PageHeader';
import Button from '../../../components/ui/Button';
import Pagination from '../../../components/ui/Pagination';
import CustomerModal from '../../../components/Customers/CustomerModal';
import api from '../../../services/api';
import { mockApi, shouldUseMockApi } from '../../../services/mockApi';
import usePolling from '../../../hooks/usePolling';
import { downloadCSV, generateFilename } from '../../../utils/exportUtils';
import { Customer } from '../../../types';

const CustomerStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let bgColor = '';
  let textColor = '';
  let icon = null;
  
  switch (status) {
    case 'active':
      bgColor = 'bg-green-100 dark:bg-green-900/20';
      textColor = 'text-green-800 dark:text-green-400';
      icon = <CheckCircleIcon className="h-4 w-4 mr-1" />;
      break;
    case 'inactive':
      bgColor = 'bg-gray-100 dark:bg-gray-700';
      textColor = 'text-gray-800 dark:text-gray-400';
      icon = <XCircleIcon className="h-4 w-4 mr-1" />;
      break;
    case 'pending':
      bgColor = 'bg-yellow-100 dark:bg-yellow-900/20';
      textColor = 'text-yellow-800 dark:text-yellow-400';
      icon = <ExclamationTriangleIcon className="h-4 w-4 mr-1" />;
      break;
    default:
      bgColor = 'bg-gray-100 dark:bg-gray-700';
      textColor = 'text-gray-800 dark:text-gray-400';
      icon = <XCircleIcon className="h-4 w-4 mr-1" />;
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const CustomersManagement: React.FC = () => {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paginatedCustomers, setPaginatedCustomers] = useState<Customer[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  
  // Define fetchCustomers function before using it
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      
      if (shouldUseMockApi()) {
        // Use mock data
        const mockCustomers: Customer[] = [
          {
            id: 'cust-001',
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '+62 812-3456-7890',
            address: 'Jl. Sudirman No. 123, Jakarta',
            client_id: 'client-001',
            client_name: 'PT. Water Solutions',
            status: 'active',
            balance: 150000,
            created_at: '2024-01-15T08:00:00Z',
            updated_at: '2024-01-20T10:30:00Z'
          },
          {
            id: 'cust-002',
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            phone: '+62 813-7890-1234',
            address: 'Jl. Thamrin No. 456, Jakarta',
            client_id: 'client-002',
            client_name: 'CV. Aqua Tech',
            status: 'inactive',
            balance: 75000,
            created_at: '2024-01-10T09:15:00Z',
            updated_at: '2024-01-18T14:45:00Z'
          },
          {
            id: 'cust-003',
            name: 'Ahmad Rahman',
            email: 'ahmad.rahman@example.com',
            phone: '+62 814-5678-9012',
            address: 'Jl. Gatot Subroto No. 789, Jakarta',
            client_id: 'client-001',
            client_name: 'PT. Water Solutions',
            status: 'active',
            balance: 200000,
            created_at: '2024-01-05T11:20:00Z',
            updated_at: '2024-01-22T16:10:00Z'
          }
        ];
        
        response = { data: mockCustomers };
      } else {
        response = await api.get('/superadmin/customers');
      }
      
      setCustomers(response.data);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };
  
  // Real-time updates using polling
  const { isPolling, startPolling, stopPolling } = usePolling({
    fetchFn: fetchCustomers,
    interval: 30000, // Poll every 30 seconds
    enabled: false, // Start disabled, enable with a toggle
    onSuccess: (data) => {
      console.log('Customers updated via polling');
    },
    onError: (error) => {
      console.error('Polling error:', error);
    }
  });

  useEffect(() => {
    fetchCustomers();
    fetchClients();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchQuery, statusFilter, clientFilter, customers]);
  
  // Apply pagination to filtered customers
  useEffect(() => {
    const totalPages = Math.ceil(filteredCustomers.length / pageSize);
    setTotalPages(totalPages || 1);
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    setPaginatedCustomers(filteredCustomers.slice(startIndex, endIndex));
    
    // Reset to page 1 if current page is now invalid
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredCustomers, currentPage, pageSize]);



  const fetchClients = async () => {
    try {
      let clientsList;
      
      if (shouldUseMockApi()) {
        // Use mock data
        clientsList = [
          { id: 'client-001', name: 'PT Water Jakarta' },
          { id: 'client-002', name: 'Bandung Water Authority' },
          { id: 'client-003', name: 'Surabaya Clean Water' },
          { id: 'client-004', name: 'Bali Water Solutions' },
          { id: 'client-005', name: 'Makassar Hydro Services' }
        ];
      } else {
        // Use real API
        const response = await api.get('/clients');
        
        if (response.data.status === 'success') {
          clientsList = response.data.data.map((client: any) => ({
            id: client.id,
            name: client.name
          }));
        } else {
          throw new Error('Failed to fetch clients');
        }
      }
      
      setClients(clientsList);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const filterCustomers = () => {
    let filtered = [...customers];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }
    
    // Apply client filter
    if (clientFilter !== 'all') {
      filtered = filtered.filter(customer => customer.client_id === clientFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.phone.includes(query) ||
        (customer.city && customer.city.toLowerCase().includes(query))
      );
    }
    
    setFilteredCustomers(filtered);
  };

  const handleAddCustomer = () => {
    setShowAddModal(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowEditModal(true);
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDeleteModal(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!selectedCustomer) return;
    
    try {
      setLoading(true);
      
      if (shouldUseMockApi()) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const updatedCustomers = customers.filter(customer => customer.id !== selectedCustomer.id);
        setCustomers(updatedCustomers);
      } else {
        // Use real API
        await api.delete(`/customers/${selectedCustomer.id}`);
        await fetchCustomers();
      }
      
      setShowDeleteModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Error deleting customer:', error);
      setError('Failed to delete customer. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveCustomer = async (customerData: Customer) => {
    try {
      setLoading(true);
      
      if (shouldUseMockApi()) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (showAddModal) {
          // Add new customer
          const newCustomer: Customer = {
            ...customerData,
            id: `cust-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
            client_name: clients.find(c => c.id === customerData.client_id)?.name || '',
            created_at: new Date().toISOString(),
            meters_count: 0,
            properties_count: 0,
            total_consumption: 0,
            last_payment_date: '',
            last_payment_amount: 0
          };
          
          setCustomers([...customers, newCustomer]);
        } else if (showEditModal && selectedCustomer) {
          // Update existing customer
          const updatedCustomers = customers.map(customer => 
            customer.id === selectedCustomer.id 
              ? { 
                  ...customer, 
                  ...customerData,
                  client_name: clients.find(c => c.id === customerData.client_id)?.name || customer.client_name
                } 
              : customer
          );
          
          setCustomers(updatedCustomers);
        }
      } else {
        // Use real API
        if (showAddModal) {
          await api.post('/customers', customerData);
        } else if (showEditModal && selectedCustomer) {
          await api.put(`/customers/${selectedCustomer.id}`, customerData);
        }
        
        await fetchCustomers();
      }
      
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Error saving customer:', error);
      setError('Failed to save customer. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const handleExportCustomers = () => {
    // Define custom headers for the CSV
    const headers = [
      { key: 'id' as keyof Customer, label: 'ID' },
      { key: 'name' as keyof Customer, label: 'Name' },
      { key: 'email' as keyof Customer, label: 'Email' },
      { key: 'phone' as keyof Customer, label: 'Phone' },
      { key: 'address' as keyof Customer, label: 'Address' },
      { key: 'city' as keyof Customer, label: 'City' },
      { key: 'status' as keyof Customer, label: 'Status' },
      { key: 'client_name' as keyof Customer, label: 'Client' },
      { key: 'meters_count' as keyof Customer, label: 'Meters Count' },
      { key: 'properties_count' as keyof Customer, label: 'Properties Count' },
      { key: 'total_consumption' as keyof Customer, label: 'Total Consumption (L)' },
      { key: 'last_payment_amount' as keyof Customer, label: 'Last Payment Amount' },
      { key: 'last_payment_date' as keyof Customer, label: 'Last Payment Date' },
      { key: 'created_at' as keyof Customer, label: 'Created At' }
    ];
    
    // Generate filename with timestamp
    const filename = generateFilename('customers_export');
    
    // Download the CSV
    downloadCSV(filteredCustomers, filename, headers);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('customers.management')}
        description={t('customers.managementDescription')}
        actions={
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleExportCustomers}>
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              {t('common.export')}
            </Button>
            <Button onClick={handleAddCustomer}>
              <PlusIcon className="h-4 w-4 mr-2" />
              {t('customers.addCustomer')}
            </Button>
          </div>
        }
      />
      
      {/* Real-time updates toggle */}
      <div className="flex items-center justify-end">
        <div className="flex items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">
            {t('common.realTimeUpdates')}:
          </span>
          <button
            type="button"
            onClick={() => isPolling ? stopPolling() : startPolling()}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isPolling ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
            role="switch"
            aria-checked={isPolling}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isPolling ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md text-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
              >
                <option value="all">All Clients</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={fetchCustomers}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        {filteredCustomers.length === 0 ? (
          <div className="px-4 py-5 sm:p-6 text-center">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No customers found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchQuery || statusFilter !== 'all' || clientFilter !== 'all' ? 'Try adjusting your filters.' : 'Get started by adding a new customer.'}
            </p>
            {!searchQuery && statusFilter === 'all' && clientFilter === 'all' && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleAddCustomer}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Customer
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Client
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Meters
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Last Payment
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {customer.profile_image ? (
                            <img className="h-10 w-10 rounded-full" src={customer.profile_image} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {customer.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {customer.city}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white flex items-center">
                        <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                        {customer.email}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <PhoneIcon className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                        {customer.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {customer.client_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <CustomerStatusBadge status={customer.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900 dark:text-white">
                        <CpuChipIcon className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                        {customer.meters_count}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <HomeIcon className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                        {customer.properties_count}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {customer.last_payment_amount ? formatCurrency(customer.last_payment_amount) : '-'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {customer.last_payment_date ? formatDate(customer.last_payment_date) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleViewCustomer(customer)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEditCustomer(customer)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredCustomers.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredCustomers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Customer Modals */}
      <CustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        mode="add"
        onSave={handleSaveCustomer}
        clients={clients}
      />
      
      <CustomerModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        mode="edit"
        customer={selectedCustomer}
        onSave={handleSaveCustomer}
        clients={clients}
      />
      
      <CustomerModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        mode="view"
        customer={selectedCustomer}
        clients={clients}
      />
      
      {/* Delete Confirmation Dialog */}
      {selectedCustomer && (
        <div className={`fixed inset-0 bg-black bg-opacity-25 z-50 flex items-center justify-center ${showDeleteModal ? 'block' : 'hidden'}`}>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Confirm Deletion</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Are you sure you want to delete customer <span className="font-semibold">{selectedCustomer.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
                loading={loading}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersManagement;
