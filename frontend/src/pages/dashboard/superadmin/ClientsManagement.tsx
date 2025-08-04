import React, { useState, useEffect, Fragment } from 'react';
import { 
  BuildingOfficeIcon, 
  PlusIcon, 
  MagnifyingGlassIcon, 
  PencilIcon, 
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  UserGroupIcon,
  CpuChipIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition, Menu } from '@headlessui/react';
import DialogOverlay from "../../../components/ui/DialogOverlay";
import { ChevronDownIcon, EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import api from '../../../services/api';
import { mockApi, shouldUseMockApi } from '../../../services/mockApi';
import { toast } from 'react-toastify';
import PageHeader from '../../../components/common/PageHeader';
import ResponsiveTable from '../../../components/ui/ResponsiveTable';
import MobileDataList from '../../../components/ui/MobileDataList';
import { useResponsive } from '../../../hooks/useResponsive';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  status: string;
  customers_count: number;
  meters_count: number;
  created_at: string;
  total_revenue: number;
  contact_person: string;
  logo_url?: string;
}

const ClientStatusBadge: React.FC<{ status: string }> = ({ status }) => {
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
    case 'suspended':
      bgColor = 'bg-red-100 dark:bg-red-900/20';
      textColor = 'text-red-800 dark:text-red-400';
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

const ClientsManagement: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    status: 'active',
    contact_person: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = clients.filter(client => 
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone.includes(searchQuery) ||
        client.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.contact_person.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients(clients);
    }
  }, [searchQuery, clients]);

  const fetchClients = async () => {
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
                id: 'client-001',
                name: 'PT Water Jakarta',
                email: 'info@waterjakarta.com',
                phone: '+62 21-5678-9012',
                address: 'Jl. Sudirman No. 123',
                city: 'Jakarta',
                status: 'active',
                customers_count: 850,
                meters_count: 1200,
                created_at: '2024-01-15',
                total_revenue: 1250000000,
                contact_person: 'Budi Santoso',
                logo_url: 'https://via.placeholder.com/150'
              },
              {
                id: 'client-002',
                name: 'CV Tirta Bandung',
                email: 'contact@tirtabandung.com',
                phone: '+62 22-1234-5678',
                address: 'Jl. Asia Afrika No. 456',
                city: 'Bandung',
                status: 'active',
                customers_count: 450,
                meters_count: 600,
                created_at: '2024-02-10',
                total_revenue: 750000000,
                contact_person: 'Siti Nurhayati',
                logo_url: 'https://via.placeholder.com/150'
              },
              {
                id: 'client-003',
                name: 'PT Aqua Surabaya',
                email: 'info@aquasurabaya.com',
                phone: '+62 31-8765-4321',
                address: 'Jl. Pemuda No. 789',
                city: 'Surabaya',
                status: 'pending',
                customers_count: 200,
                meters_count: 350,
                created_at: '2024-03-05',
                total_revenue: 450000000,
                contact_person: 'Ahmad Rahman',
                logo_url: 'https://via.placeholder.com/150'
              },
              {
                id: 'client-004',
                name: 'PT Hydro Makassar',
                email: 'contact@hydromakassar.com',
                phone: '+62 41-2345-6789',
                address: 'Jl. Urip Sumoharjo No. 101',
                city: 'Makassar',
                status: 'active',
                customers_count: 300,
                meters_count: 450,
                created_at: '2024-03-20',
                total_revenue: 550000000,
                contact_person: 'Dewi Anggraini',
                logo_url: 'https://via.placeholder.com/150'
              },
              {
                id: 'client-005',
                name: 'CV Bali Water',
                email: 'info@baliwater.com',
                phone: '+62 36-1234-5678',
                address: 'Jl. Sunset Road No. 202',
                city: 'Denpasar',
                status: 'inactive',
                customers_count: 150,
                meters_count: 200,
                created_at: '2024-04-10',
                total_revenue: 250000000,
                contact_person: 'Made Wijaya',
                logo_url: 'https://via.placeholder.com/150'
              }
            ]
          }
        };
      } else {
        // Use real API
        response = await api.get('/clients');
      }
      
      if (response.data.status === 'success') {
        setClients(response.data.data);
        setFilteredClients(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async () => {
    try {
      setLoading(true);
      
      if (shouldUseMockApi()) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const newClient: Client = {
          id: `client-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          status: formData.status,
          customers_count: 0,
          meters_count: 0,
          created_at: new Date().toISOString().split('T')[0],
          total_revenue: 0,
          contact_person: formData.contact_person,
          logo_url: 'https://via.placeholder.com/150'
        };
        
        setClients([...clients, newClient]);
      } else {
        // Use real API
        await api.post('/clients', formData);
        await fetchClients();
      }
      
      setIsAddModalOpen(false);
      resetForm();
      toast.success('Client added successfully');
    } catch (error) {
      console.error('Error adding client:', error);
      toast.error('Failed to add client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClient = async () => {
    if (!selectedClient) return;
    
    try {
      setLoading(true);
      
      if (shouldUseMockApi()) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const updatedClients = clients.map(client => 
          client.id === selectedClient.id 
            ? { ...client, ...formData } 
            : client
        );
        
        setClients(updatedClients);
      } else {
        // Use real API
        await api.put(`/clients/${selectedClient.id}`, formData);
        await fetchClients();
      }
      
      setIsEditModalOpen(false);
      resetForm();
      toast.success('Client updated successfully');
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Failed to update client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;
    
    try {
      setLoading(true);
      
      if (shouldUseMockApi()) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const updatedClients = clients.filter(client => client.id !== selectedClient.id);
        setClients(updatedClients);
      } else {
        // Use real API
        await api.delete(`/clients/${selectedClient.id}`);
        await fetchClients();
      }
      
      setIsDeleteModalOpen(false);
      toast.success('Client deleted successfully');
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      city: client.city,
      status: client.status,
      contact_person: client.contact_person
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteModalOpen(true);
  };

  const openViewModal = (client: Client) => {
    setSelectedClient(client);
    setIsViewModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      status: 'active',
      contact_person: ''
    });
    setSelectedClient(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients Management"
        description="Manage water authority clients"
        actions={
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Client
          </button>
        }
      />

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
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
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center">
              <button
                type="button"
                onClick={fetchClients}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
              >
                <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Clients Table/List */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="px-4 py-5 sm:p-6 text-center">
              <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No clients found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchQuery ? 'Try a different search term.' : 'Get started by adding a new client.'}
              </p>
              {!searchQuery && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Add Client
                  </button>
                </div>
              )}
            </div>
          ) : (
            <ResponsiveView 
              clients={filteredClients} 
              openViewModal={openViewModal}
              openEditModal={openEditModal}
              openDeleteModal={openDeleteModal}
              formatDate={formatDate}
              formatCurrency={formatCurrency}
            />
          )}
        </div>
      </div>

      {/* Add Client Modal */}
      <Transition.Root show={isAddModalOpen} as={Fragment}>
        <Dialog as="div" className="fixed z-10 inset-0 overflow-y-auto" onClose={setIsAddModalOpen}>
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
              <DialogOverlay className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity" />
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
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <BuildingOfficeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Add New Client
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Fill in the details to add a new water authority client.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6">
                  <form className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Company Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        name="contact_person"
                        id="contact_person"
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.contact_person}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        name="phone"
                        id="phone"
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Address
                      </label>
                      <input
                        type="text"
                        name="address"
                        id="address"
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        id="city"
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </form>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                    onClick={handleAddClient}
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Client'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Edit Client Modal */}
      <Transition.Root show={isEditModalOpen} as={Fragment}>
        <Dialog as="div" className="fixed z-10 inset-0 overflow-y-auto" onClose={setIsEditModalOpen}>
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
              <DialogOverlay className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity" />
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
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <PencilIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Edit Client
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Update the client information.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6">
                  <form className="space-y-4">
                    <div>
                      <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Company Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="edit-name"
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-contact_person" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        name="contact_person"
                        id="edit-contact_person"
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.contact_person}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="edit-email"
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        name="phone"
                        id="edit-phone"
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Address
                      </label>
                      <input
                        type="text"
                        name="address"
                        id="edit-address"
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        id="edit-city"
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Status
                      </label>
                      <select
                        id="edit-status"
                        name="status"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.status}
                        onChange={handleInputChange}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </form>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                    onClick={handleEditClient}
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Client'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Delete Client Modal */}
      <Transition.Root show={isDeleteModalOpen} as={Fragment}>
        <Dialog as="div" className="fixed z-10 inset-0 overflow-y-auto" onClose={setIsDeleteModalOpen}>
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
              <DialogOverlay className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity" />
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
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                    <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Delete Client
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete this client? This action cannot be undone.
                      </p>
                      {selectedClient && (
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedClient.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{selectedClient.email}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{selectedClient.phone}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{selectedClient.city}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                    onClick={handleDeleteClient}
                    disabled={loading}
                  >
                    {loading ? 'Deleting...' : 'Delete Client'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* View Client Modal */}
      <Transition.Root show={isViewModalOpen} as={Fragment}>
        <Dialog as="div" className="fixed z-10 inset-0 overflow-y-auto" onClose={setIsViewModalOpen}>
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
              <DialogOverlay className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity" />
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
                {selectedClient && (
                  <>
                    <div>
                      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30">
                        {selectedClient.logo_url ? (
                          <img src={selectedClient.logo_url} alt={selectedClient.name} className="h-10 w-10 rounded-full" />
                        ) : (
                          <BuildingOfficeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <div className="mt-3 text-center sm:mt-5">
                        <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                          {selectedClient.name}
                        </Dialog.Title>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Client ID: {selectedClient.id}
                          </p>
                          <div className="mt-2 flex justify-center">
                            <ClientStatusBadge status={selectedClient.status} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5">
                      <div className="border-t border-gray-200 dark:border-gray-700 py-4">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Person</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{selectedClient.contact_person}</dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{selectedClient.email}</dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{selectedClient.phone}</dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">City</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{selectedClient.city}</dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{selectedClient.address}</dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Customers</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{selectedClient.customers_count}</dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Meters</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{selectedClient.meters_count}</dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{formatCurrency(selectedClient.total_revenue)}</dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(selectedClient.created_at)}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                    <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                      <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                        onClick={() => openEditModal(selectedClient)}
                      >
                        <PencilIcon className="-ml-1 mr-2 h-5 w-5" />
                        Edit Client
                      </button>
                      <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                        onClick={() => setIsViewModalOpen(false)}
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
};

// Responsive view component that switches between table and card list based on screen size
interface ResponsiveViewProps {
  clients: Client[];
  openViewModal: (client: Client) => void;
  openEditModal: (client: Client) => void;
  openDeleteModal: (client: Client) => void;
  formatDate: (date: string) => string;
  formatCurrency: (amount: number) => string;
}

const ResponsiveView: React.FC<ResponsiveViewProps> = ({
  clients,
  openViewModal,
  openEditModal,
  openDeleteModal,
  formatDate,
  formatCurrency
}) => {
  const { isMobile } = useResponsive();

  // For mobile view, use MobileDataList
  if (isMobile) {
    return (
      <MobileDataList
        data={clients}
        keyExtractor={(client) => client.id}
        title={(client) => client.name}
        subtitle={(client) => `${client.city} • ${formatDate(client.created_at)}`}
        icon={(client) => (
          <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            {client.logo_url ? (
              <img src={client.logo_url} alt={client.name} className="h-10 w-10 rounded-full" />
            ) : (
              <BuildingOfficeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            )}
          </div>
        )}
        items={[
          {
            label: 'Status',
            value: (client) => <ClientStatusBadge status={client.status} />
          },
          {
            label: 'Contact Person',
            value: 'contact_person',
            icon: <UserGroupIcon className="h-4 w-4 text-gray-500" />
          },
          {
            label: 'Email',
            value: 'email'
          },
          {
            label: 'Phone',
            value: 'phone'
          },
          {
            label: 'Customers',
            value: 'customers_count',
            icon: <UserGroupIcon className="h-4 w-4 text-gray-500" />
          },
          {
            label: 'Meters',
            value: 'meters_count',
            icon: <CpuChipIcon className="h-4 w-4 text-gray-500" />
          },
          {
            label: 'Revenue',
            value: (client) => formatCurrency(client.total_revenue),
            icon: <BanknotesIcon className="h-4 w-4 text-gray-500" />
          }
        ]}
        onItemClick={openViewModal}
        renderFooter={(client) => (
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openEditModal(client);
              }}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              Edit
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openDeleteModal(client);
              }}
              className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 dark:bg-gray-700 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              Delete
            </button>
          </div>
        )}
      />
    );
  }

  // For desktop view, use ResponsiveTable
  return (
    <ResponsiveTable
      data={clients}
      keyExtractor={(client) => client.id}
      columns={[
        {
          header: 'Client',
          accessor: (client) => (
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                {client.logo_url ? (
                  <img src={client.logo_url} alt={client.name} className="h-10 w-10 rounded-full" />
                ) : (
                  <BuildingOfficeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {client.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  ID: {client.id}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Since: {formatDate(client.created_at)}
                </div>
              </div>
            </div>
          )
        },
        {
          header: 'Contact',
          accessor: (client) => (
            <div>
              <div className="text-sm text-gray-900 dark:text-white">{client.contact_person}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{client.email}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{client.phone}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{client.city}</div>
            </div>
          ),
          mobileRender: false
        },
        {
          header: 'Status',
          accessor: (client) => <ClientStatusBadge status={client.status} />
        },
        {
          header: 'Customers',
          accessor: (client) => (
            <div className="flex items-center">
              <UserGroupIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
              <span className="text-sm text-gray-900 dark:text-white">{client.customers_count}</span>
            </div>
          ),
          tabletRender: false
        },
        {
          header: 'Meters',
          accessor: (client) => (
            <div className="flex items-center">
              <CpuChipIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
              <span className="text-sm text-gray-900 dark:text-white">{client.meters_count}</span>
            </div>
          ),
          tabletRender: false
        },
        {
          header: 'Revenue',
          accessor: (client) => (
            <div className="flex items-center">
              <BanknotesIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
              <span className="text-sm text-gray-900 dark:text-white">{formatCurrency(client.total_revenue)}</span>
            </div>
          )
        },
        {
          header: 'Actions',
          accessor: (client) => (
            <div className="text-right">
              <Menu as="div" className="relative inline-block text-left">
                <div>
                  <Menu.Button className="inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-800 px-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                  </Menu.Button>
                </div>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => openViewModal(client)}
                            className={`${
                              active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                            } flex w-full items-center px-4 py-2 text-sm`}
                          >
                            <BuildingOfficeIcon className="mr-3 h-5 w-5" aria-hidden="true" />
                            View Details
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => openEditModal(client)}
                            className={`${
                              active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                            } flex w-full items-center px-4 py-2 text-sm`}
                          >
                            <PencilIcon className="mr-3 h-5 w-5" aria-hidden="true" />
                            Edit
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => openDeleteModal(client)}
                            className={`${
                              active ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                            } flex w-full items-center px-4 py-2 text-sm`}
                          >
                            <TrashIcon className="mr-3 h-5 w-5 text-red-500" aria-hidden="true" />
                            Delete
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          )
        }
      ]}
      onRowClick={openViewModal}
    />
  );
};

export default ClientsManagement;
