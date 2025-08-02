import React, { useState, useEffect, Fragment } from 'react';
import { 
  CpuChipIcon, 
  PlusIcon, 
  MagnifyingGlassIcon, 
  PencilIcon, 
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  BoltIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition, Menu } from '@headlessui/react';
import DialogOverlay from "../../../components/ui/DialogOverlay";
import { ChevronDownIcon, EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import api from '../../../services/api';
import { mockApi, shouldUseMockApi } from '../../../services/mockApi';
import { toast } from 'react-toastify';

interface Meter {
  id: string;
  meter_id: string;
  customer_id: string;
  customer_name: string;
  property_id: string;
  property_name: string;
  installation_date: string;
  meter_type: string;
  meter_model: string;
  meter_serial: string;
  firmware_version: string;
  hardware_version: string;
  location_description: string;
  status: string;
  last_reading: number;
  last_reading_at: string;
  credit_balance: number;
  last_credit_at: string;
}

const MeterStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let bgColor = '';
  let textColor = '';
  let icon = null;
  
  switch (status) {
    case 'active':
    case 'connected':
      bgColor = 'bg-green-100 dark:bg-green-900/20';
      textColor = 'text-green-800 dark:text-green-400';
      icon = <CheckCircleIcon className="h-4 w-4 mr-1" />;
      break;
    case 'inactive':
    case 'disconnected':
      bgColor = 'bg-gray-100 dark:bg-gray-700';
      textColor = 'text-gray-800 dark:text-gray-400';
      icon = <XCircleIcon className="h-4 w-4 mr-1" />;
      break;
    case 'offline':
      bgColor = 'bg-red-100 dark:bg-red-900/20';
      textColor = 'text-red-800 dark:text-red-400';
      icon = <XCircleIcon className="h-4 w-4 mr-1" />;
      break;
    case 'warning':
    case 'low_credit':
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
      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </span>
  );
};

const Meters: React.FC = () => {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [filteredMeters, setFilteredMeters] = useState<Meter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState<boolean>(false);
  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);
  const [formData, setFormData] = useState({
    meter_id: '',
    customer_id: '',
    property_id: '',
    installation_date: '',
    meter_type: 'smart',
    meter_model: 'IndoWater SM-100',
    meter_serial: '',
    firmware_version: '1.0.0',
    hardware_version: '1.0.0',
    location_description: '',
    status: 'active'
  });
  const [topUpAmount, setTopUpAmount] = useState<number>(100000);
  const [customers, setCustomers] = useState<{id: string, name: string}[]>([]);
  const [properties, setProperties] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    fetchMeters();
    fetchCustomers();
    fetchProperties();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = meters.filter(meter => 
        meter.meter_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meter.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meter.property_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meter.meter_serial.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meter.location_description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMeters(filtered);
    } else {
      setFilteredMeters(meters);
    }
  }, [searchQuery, meters]);

  const fetchMeters = async () => {
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
                id: 'meter-001',
                meter_id: 'MTR000001',
                customer_id: 'cust-001',
                customer_name: 'John Doe',
                property_id: 'prop-001',
                property_name: 'Apartment A-101',
                installation_date: '2024-05-15',
                meter_type: 'smart',
                meter_model: 'IndoWater SM-100',
                meter_serial: 'SN00000001',
                firmware_version: '1.2.3',
                hardware_version: '2.1.0',
                location_description: 'Main water inlet',
                status: 'active',
                last_reading: 1234.5,
                last_reading_at: '2024-07-31T08:30:00',
                credit_balance: 250000,
                last_credit_at: '2024-07-15T14:20:00'
              },
              {
                id: 'meter-002',
                meter_id: 'MTR000002',
                customer_id: 'cust-002',
                customer_name: 'Jane Smith',
                property_id: 'prop-002',
                property_name: 'House B-205',
                installation_date: '2024-05-20',
                meter_type: 'smart',
                meter_model: 'IndoWater SM-100',
                meter_serial: 'SN00000002',
                firmware_version: '1.2.3',
                hardware_version: '2.1.0',
                location_description: 'Side entrance',
                status: 'active',
                last_reading: 567.8,
                last_reading_at: '2024-07-31T08:35:00',
                credit_balance: 120000,
                last_credit_at: '2024-07-20T10:15:00'
              },
              {
                id: 'meter-003',
                meter_id: 'MTR000003',
                customer_id: 'cust-003',
                customer_name: 'Ahmad Rahman',
                property_id: 'prop-003',
                property_name: 'Apartment C-310',
                installation_date: '2024-06-10',
                meter_type: 'smart',
                meter_model: 'IndoWater SM-100',
                meter_serial: 'SN00000003',
                firmware_version: '1.2.3',
                hardware_version: '2.1.0',
                location_description: 'Main entrance',
                status: 'warning',
                last_reading: 890.2,
                last_reading_at: '2024-07-31T08:40:00',
                credit_balance: 45000,
                last_credit_at: '2024-07-10T16:30:00'
              },
              {
                id: 'meter-004',
                meter_id: 'MTR000004',
                customer_id: 'cust-004',
                customer_name: 'Siti Nurhayati',
                property_id: 'prop-004',
                property_name: 'Villa D-405',
                installation_date: '2024-06-15',
                meter_type: 'smart',
                meter_model: 'IndoWater SM-200',
                meter_serial: 'SN00000004',
                firmware_version: '1.3.0',
                hardware_version: '2.2.0',
                location_description: 'Back entrance',
                status: 'active',
                last_reading: 1456.7,
                last_reading_at: '2024-07-31T08:45:00',
                credit_balance: 320000,
                last_credit_at: '2024-07-25T09:10:00'
              },
              {
                id: 'meter-005',
                meter_id: 'MTR000005',
                customer_id: 'cust-005',
                customer_name: 'Budi Santoso',
                property_id: 'prop-005',
                property_name: 'House E-501',
                installation_date: '2024-07-01',
                meter_type: 'smart',
                meter_model: 'IndoWater SM-100',
                meter_serial: 'SN00000005',
                firmware_version: '1.2.3',
                hardware_version: '2.1.0',
                location_description: 'Front yard',
                status: 'offline',
                last_reading: 234.5,
                last_reading_at: '2024-07-30T10:20:00',
                credit_balance: 80000,
                last_credit_at: '2024-07-05T11:45:00'
              }
            ]
          }
        };
      } else {
        // Use real API
        response = await api.get('/meters');
      }
      
      if (response.data.status === 'success') {
        setMeters(response.data.data);
        setFilteredMeters(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching meters:', error);
      toast.error('Failed to load meters. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      let response;
      
      if (shouldUseMockApi()) {
        // Use mock data
        response = {
          data: {
            status: 'success',
            data: [
              { id: 'cust-001', name: 'John Doe' },
              { id: 'cust-002', name: 'Jane Smith' },
              { id: 'cust-003', name: 'Ahmad Rahman' },
              { id: 'cust-004', name: 'Siti Nurhayati' },
              { id: 'cust-005', name: 'Budi Santoso' }
            ]
          }
        };
      } else {
        // Use real API
        response = await api.get('/customers');
      }
      
      if (response.data.status === 'success') {
        setCustomers(response.data.data.map((customer: any) => ({
          id: customer.id,
          name: customer.name
        })));
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      let response;
      
      if (shouldUseMockApi()) {
        // Use mock data
        response = {
          data: {
            status: 'success',
            data: [
              { id: 'prop-001', name: 'Apartment A-101' },
              { id: 'prop-002', name: 'House B-205' },
              { id: 'prop-003', name: 'Apartment C-310' },
              { id: 'prop-004', name: 'Villa D-405' },
              { id: 'prop-005', name: 'House E-501' }
            ]
          }
        };
      } else {
        // Use real API
        response = await api.get('/properties');
      }
      
      if (response.data.status === 'success') {
        setProperties(response.data.data.map((property: any) => ({
          id: property.id,
          name: property.name || property.address
        })));
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const handleAddMeter = async () => {
    try {
      setLoading(true);
      
      if (shouldUseMockApi()) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const newMeter: Meter = {
          id: `meter-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
          meter_id: formData.meter_id,
          customer_id: formData.customer_id,
          customer_name: customers.find(c => c.id === formData.customer_id)?.name || '',
          property_id: formData.property_id,
          property_name: properties.find(p => p.id === formData.property_id)?.name || '',
          installation_date: formData.installation_date,
          meter_type: formData.meter_type,
          meter_model: formData.meter_model,
          meter_serial: formData.meter_serial,
          firmware_version: formData.firmware_version,
          hardware_version: formData.hardware_version,
          location_description: formData.location_description,
          status: formData.status,
          last_reading: 0,
          last_reading_at: new Date().toISOString(),
          credit_balance: 0,
          last_credit_at: new Date().toISOString()
        };
        
        setMeters([...meters, newMeter]);
      } else {
        // Use real API
        await api.post('/meters', formData);
        await fetchMeters();
      }
      
      setIsAddModalOpen(false);
      resetForm();
      toast.success('Meter added successfully');
    } catch (error) {
      console.error('Error adding meter:', error);
      toast.error('Failed to add meter. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditMeter = async () => {
    if (!selectedMeter) return;
    
    try {
      setLoading(true);
      
      if (shouldUseMockApi()) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const updatedMeters = meters.map(meter => 
          meter.id === selectedMeter.id 
            ? { 
                ...meter, 
                ...formData,
                customer_name: customers.find(c => c.id === formData.customer_id)?.name || meter.customer_name,
                property_name: properties.find(p => p.id === formData.property_id)?.name || meter.property_name
              } 
            : meter
        );
        
        setMeters(updatedMeters);
      } else {
        // Use real API
        await api.put(`/meters/${selectedMeter.id}`, formData);
        await fetchMeters();
      }
      
      setIsEditModalOpen(false);
      resetForm();
      toast.success('Meter updated successfully');
    } catch (error) {
      console.error('Error updating meter:', error);
      toast.error('Failed to update meter. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMeter = async () => {
    if (!selectedMeter) return;
    
    try {
      setLoading(true);
      
      if (shouldUseMockApi()) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const updatedMeters = meters.filter(meter => meter.id !== selectedMeter.id);
        setMeters(updatedMeters);
      } else {
        // Use real API
        await api.delete(`/meters/${selectedMeter.id}`);
        await fetchMeters();
      }
      
      setIsDeleteModalOpen(false);
      toast.success('Meter deleted successfully');
    } catch (error) {
      console.error('Error deleting meter:', error);
      toast.error('Failed to delete meter. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTopUpMeter = async () => {
    if (!selectedMeter) return;
    
    try {
      setLoading(true);
      
      if (shouldUseMockApi()) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const updatedMeters = meters.map(meter => 
          meter.id === selectedMeter.id 
            ? { 
                ...meter, 
                credit_balance: meter.credit_balance + topUpAmount,
                last_credit_at: new Date().toISOString()
              } 
            : meter
        );
        
        setMeters(updatedMeters);
      } else {
        // Use real API
        await api.post(`/meters/${selectedMeter.id}/topup`, {
          amount: topUpAmount,
          description: 'Manual credit top-up'
        });
        await fetchMeters();
      }
      
      setIsTopUpModalOpen(false);
      setTopUpAmount(100000);
      toast.success('Meter credit topped up successfully');
    } catch (error) {
      console.error('Error topping up meter:', error);
      toast.error('Failed to top up meter credit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (meter: Meter) => {
    setSelectedMeter(meter);
    setFormData({
      meter_id: meter.meter_id,
      customer_id: meter.customer_id,
      property_id: meter.property_id,
      installation_date: meter.installation_date,
      meter_type: meter.meter_type,
      meter_model: meter.meter_model,
      meter_serial: meter.meter_serial,
      firmware_version: meter.firmware_version,
      hardware_version: meter.hardware_version,
      location_description: meter.location_description,
      status: meter.status
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (meter: Meter) => {
    setSelectedMeter(meter);
    setIsDeleteModalOpen(true);
  };

  const openTopUpModal = (meter: Meter) => {
    setSelectedMeter(meter);
    setIsTopUpModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      meter_id: '',
      customer_id: '',
      property_id: '',
      installation_date: '',
      meter_type: 'smart',
      meter_model: 'IndoWater SM-100',
      meter_serial: '',
      firmware_version: '1.0.0',
      hardware_version: '1.0.0',
      location_description: '',
      status: 'active'
    });
    setSelectedMeter(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            Smart Meters
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your IoT water meters
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Meter
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-6">
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
                  placeholder="Search meters..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center">
              <button
                type="button"
                onClick={fetchMeters}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
              >
                <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Meters Table */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredMeters.length === 0 ? (
            <div className="px-4 py-5 sm:p-6 text-center">
              <CpuChipIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No meters found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchQuery ? 'Try a different search term.' : 'Get started by adding a new meter.'}
              </p>
              {!searchQuery && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Add Meter
                  </button>
                </div>
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Meter
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Last Reading
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Credit Balance
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredMeters.map((meter) => (
                  <tr key={meter.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full">
                          <CpuChipIcon className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {meter.meter_id}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {meter.meter_model} - {meter.meter_serial}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {meter.location_description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{meter.customer_name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{meter.property_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <MeterStatusBadge status={meter.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{meter.last_reading.toFixed(1)} m³</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(meter.last_reading_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${meter.credit_balance < 50000 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                        {formatCurrency(meter.credit_balance)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Last top-up: {new Date(meter.last_credit_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Menu as="div" className="relative inline-block text-left">
                        <div>
                          <Menu.Button className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-gray-700 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            <span className="sr-only">Open options</span>
                            <EllipsisVerticalIcon className="w-5 h-5" aria-hidden="true" />
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
                          <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                            <div className="py-1">
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => openTopUpModal(meter)}
                                    className={`${
                                      active ? 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'
                                    } flex items-center w-full px-4 py-2 text-sm`}
                                  >
                                    <BoltIcon className="mr-3 h-5 w-5 text-green-500" />
                                    Top Up Credit
                                  </button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => openEditModal(meter)}
                                    className={`${
                                      active ? 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'
                                    } flex items-center w-full px-4 py-2 text-sm`}
                                  >
                                    <PencilIcon className="mr-3 h-5 w-5 text-blue-500" />
                                    Edit
                                  </button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => openDeleteModal(meter)}
                                    className={`${
                                      active ? 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'
                                    } flex items-center w-full px-4 py-2 text-sm`}
                                  >
                                    <TrashIcon className="mr-3 h-5 w-5 text-red-500" />
                                    Delete
                                  </button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    className={`${
                                      active ? 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'
                                    } flex items-center w-full px-4 py-2 text-sm`}
                                  >
                                    <WrenchScrewdriverIcon className="mr-3 h-5 w-5 text-yellow-500" />
                                    Maintenance
                                  </button>
                                )}
                              </Menu.Item>
                            </div>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Meter Modal */}
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
              <DialogOverlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
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
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20">
                    <CpuChipIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Add New Meter
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Fill in the details to add a new smart water meter.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6">
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="meter_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Meter ID
                        </label>
                        <input
                          type="text"
                          name="meter_id"
                          id="meter_id"
                          value={formData.meter_id}
                          onChange={handleInputChange}
                          className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="MTR000001"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="meter_serial" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Serial Number
                        </label>
                        <input
                          type="text"
                          name="meter_serial"
                          id="meter_serial"
                          value={formData.meter_serial}
                          onChange={handleInputChange}
                          className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="SN00000001"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Customer
                        </label>
                        <select
                          id="customer_id"
                          name="customer_id"
                          value={formData.customer_id}
                          onChange={handleInputChange}
                          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        >
                          <option value="">Select Customer</option>
                          {customers.map(customer => (
                            <option key={customer.id} value={customer.id}>{customer.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="property_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Property
                        </label>
                        <select
                          id="property_id"
                          name="property_id"
                          value={formData.property_id}
                          onChange={handleInputChange}
                          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        >
                          <option value="">Select Property</option>
                          {properties.map(property => (
                            <option key={property.id} value={property.id}>{property.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="installation_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Installation Date
                        </label>
                        <input
                          type="date"
                          name="installation_date"
                          id="installation_date"
                          value={formData.installation_date}
                          onChange={handleInputChange}
                          className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="meter_model" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Meter Model
                        </label>
                        <select
                          id="meter_model"
                          name="meter_model"
                          value={formData.meter_model}
                          onChange={handleInputChange}
                          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="IndoWater SM-100">IndoWater SM-100</option>
                          <option value="IndoWater SM-200">IndoWater SM-200</option>
                          <option value="IndoWater SM-300">IndoWater SM-300</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="location_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Location Description
                        </label>
                        <textarea
                          id="location_description"
                          name="location_description"
                          rows={2}
                          value={formData.location_description}
                          onChange={handleInputChange}
                          className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="Main water inlet, front yard, etc."
                        />
                      </div>
                    </div>
                  </form>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                    onClick={handleAddMeter}
                  >
                    Add Meter
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
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

      {/* Edit Meter Modal */}
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
              <DialogOverlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
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
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20">
                    <PencilIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Edit Meter
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Update the details for meter {selectedMeter?.meter_id}.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6">
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="meter_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Meter ID
                        </label>
                        <input
                          type="text"
                          name="meter_id"
                          id="meter_id"
                          value={formData.meter_id}
                          onChange={handleInputChange}
                          className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="MTR000001"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="meter_serial" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Serial Number
                        </label>
                        <input
                          type="text"
                          name="meter_serial"
                          id="meter_serial"
                          value={formData.meter_serial}
                          onChange={handleInputChange}
                          className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="SN00000001"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Customer
                        </label>
                        <select
                          id="customer_id"
                          name="customer_id"
                          value={formData.customer_id}
                          onChange={handleInputChange}
                          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        >
                          <option value="">Select Customer</option>
                          {customers.map(customer => (
                            <option key={customer.id} value={customer.id}>{customer.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="property_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Property
                        </label>
                        <select
                          id="property_id"
                          name="property_id"
                          value={formData.property_id}
                          onChange={handleInputChange}
                          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        >
                          <option value="">Select Property</option>
                          {properties.map(property => (
                            <option key={property.id} value={property.id}>{property.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Status
                        </label>
                        <select
                          id="status"
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="offline">Offline</option>
                          <option value="warning">Warning</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="location_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Location Description
                        </label>
                        <textarea
                          id="location_description"
                          name="location_description"
                          rows={2}
                          value={formData.location_description}
                          onChange={handleInputChange}
                          className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="Main water inlet, front yard, etc."
                        />
                      </div>
                    </div>
                  </form>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                    onClick={handleEditMeter}
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
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

      {/* Delete Meter Modal */}
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
              <DialogOverlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
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
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 sm:mx-0 sm:h-10 sm:w-10">
                    <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Delete Meter
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete meter {selectedMeter?.meter_id}? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleDeleteMeter}
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={() => setIsDeleteModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Top Up Modal */}
      <Transition.Root show={isTopUpModalOpen} as={Fragment}>
        <Dialog as="div" className="fixed z-10 inset-0 overflow-y-auto" onClose={setIsTopUpModalOpen}>
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
              <DialogOverlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
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
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20">
                    <BoltIcon className="h-6 w-6 text-green-600 dark:text-green-400" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Top Up Meter Credit
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Add credit to meter {selectedMeter?.meter_id} for customer {selectedMeter?.customer_name}.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6">
                  <div className="mb-4">
                    <label htmlFor="topUpAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Amount (IDR)
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 dark:text-gray-400 sm:text-sm">Rp</span>
                      </div>
                      <input
                        type="number"
                        name="topUpAmount"
                        id="topUpAmount"
                        value={topUpAmount}
                        onChange={(e) => setTopUpAmount(Number(e.target.value))}
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="0"
                        min="10000"
                        step="10000"
                      />
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md mb-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Current Balance:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedMeter ? formatCurrency(selectedMeter.credit_balance) : 'Rp 0'}
                      </span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Top Up Amount:</span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(topUpAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">New Balance:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedMeter ? formatCurrency(selectedMeter.credit_balance + topUpAmount) : formatCurrency(topUpAmount)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:col-start-2 sm:text-sm"
                    onClick={handleTopUpMeter}
                    disabled={topUpAmount < 10000}
                  >
                    Top Up
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    onClick={() => {
                      setIsTopUpModalOpen(false);
                      setTopUpAmount(100000);
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
    </div>
  );
};

export default Meters;
