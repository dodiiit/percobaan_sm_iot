import React, { useState, useEffect } from 'react';
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
  WrenchIcon,
  BanknotesIcon,
  BeakerIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../../components/common/PageHeader';
import Button from '../../../components/ui/Button';
import Pagination from '../../../components/ui/Pagination';
import api from '../../../services/api';
import { mockApi, shouldUseMockApi } from '../../../services/mockApi';
import MeterModal from '../../../components/Meters/MeterModal';
import usePolling from '../../../hooks/usePolling';
import { downloadCSV, generateFilename } from '../../../utils/exportUtils';
import { Meter } from '../../../types';

const MeterStatusBadge: React.FC<{ status: string }> = ({ status }) => {
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
    case 'offline':
      bgColor = 'bg-red-100 dark:bg-red-900/20';
      textColor = 'text-red-800 dark:text-red-400';
      icon = <ExclamationTriangleIcon className="h-4 w-4 mr-1" />;
      break;
    case 'maintenance':
      bgColor = 'bg-yellow-100 dark:bg-yellow-900/20';
      textColor = 'text-yellow-800 dark:text-yellow-400';
      icon = <WrenchIcon className="h-4 w-4 mr-1" />;
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

const ValveStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const bgColor = status === 'open' 
    ? 'bg-green-100 dark:bg-green-900/20' 
    : 'bg-red-100 dark:bg-red-900/20';
  
  const textColor = status === 'open' 
    ? 'text-green-800 dark:text-green-400' 
    : 'text-red-800 dark:text-red-400';
  
  const icon = status === 'open' 
    ? <BoltIcon className="h-4 w-4 mr-1" /> 
    : <XCircleIcon className="h-4 w-4 mr-1" />;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const MetersManagement: React.FC = () => {
  const { t } = useTranslation();
  const [meters, setMeters] = useState<Meter[]>([]);
  const [filteredMeters, setFilteredMeters] = useState<Meter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);
  const [clientFilter, setClientFilter] = useState('all');
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paginatedMeters, setPaginatedMeters] = useState<Meter[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  
  // Define fetchMeters function before using it
  const fetchMeters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      
      if (shouldUseMockApi()) {
        // Use mock data
        const mockMeters: Meter[] = [
          {
            id: '1',
            meter_id: 'WM-001234',
            customer_name: 'John Doe',
            customer_id: 'cust-001',
            location: 'Jl. Sudirman No. 123, Jakarta',
            status: 'active',
            last_reading: 1250.5,
            last_reading_date: '2024-01-20T10:30:00Z',
            installation_date: '2024-01-15T08:00:00Z',
            client_name: 'PT. Water Solutions',
            client_id: 'client-001',
            battery_level: 85,
            signal_strength: 'strong'
          },
          {
            id: '2',
            meter_id: 'WM-001235',
            customer_name: 'Jane Smith',
            customer_id: 'cust-002',
            location: 'Jl. Thamrin No. 456, Jakarta',
            status: 'maintenance',
            last_reading: 980.2,
            last_reading_date: '2024-01-18T14:45:00Z',
            installation_date: '2024-01-10T09:15:00Z',
            client_name: 'CV. Aqua Tech',
            client_id: 'client-002',
            battery_level: 45,
            signal_strength: 'weak'
          }
        ];
        
        response = { data: mockMeters };
      } else {
        response = await api.get('/superadmin/meters');
      }
      
      setMeters(response.data);
    } catch (err) {
      console.error('Error fetching meters:', err);
      setError('Failed to fetch meters');
    } finally {
      setLoading(false);
    }
  };
  
  // Real-time updates using polling
  const { isPolling, startPolling, stopPolling } = usePolling({
    fetchFn: fetchMeters,
    interval: 30000, // Poll every 30 seconds
    enabled: false, // Start disabled, enable with a toggle
    onSuccess: (data) => {
      console.log('Meters updated via polling');
    },
    onError: (error) => {
      console.error('Polling error:', error);
    }
  });

  useEffect(() => {
    fetchMeters();
    fetchClients();
  }, []);

  useEffect(() => {
    filterMeters();
  }, [searchQuery, statusFilter, clientFilter, meters]);
  
  // Apply pagination to filtered meters
  useEffect(() => {
    const totalPages = Math.ceil(filteredMeters.length / pageSize);
    setTotalPages(totalPages || 1);
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    setPaginatedMeters(filteredMeters.slice(startIndex, endIndex));
    
    // Reset to page 1 if current page is now invalid
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredMeters, currentPage, pageSize]);

  
  const fetchClients = async () => {
    try {
      let clientsList;
      
      if (shouldUseMockApi()) {
        // Use mock data
        clientsList = [
          { id: 'CLIENT-001', name: 'PT Water Jakarta' },
          { id: 'CLIENT-002', name: 'Bandung Water Authority' },
          { id: 'CLIENT-003', name: 'Surabaya Clean Water' },
          { id: 'CLIENT-004', name: 'Bali Water Solutions' },
          { id: 'CLIENT-005', name: 'Makassar Hydro Services' }
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

  const filterMeters = () => {
    let filtered = [...meters];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(meter => meter.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(meter => 
        meter.meter_id.toLowerCase().includes(query) ||
        meter.customer_name.toLowerCase().includes(query) ||
        (meter.property_name && meter.property_name.toLowerCase().includes(query)) ||
        meter.client_name.toLowerCase().includes(query)
      );
    }
    
    setFilteredMeters(filtered);
  };

  const handleAddMeter = () => {
    setSelectedMeter(null);
    setShowAddModal(true);
  };

  const handleEditMeter = (meter: Meter) => {
    setSelectedMeter(meter);
    setShowEditModal(true);
  };

  const handleViewMeter = (meter: Meter) => {
    setSelectedMeter(meter);
    setShowViewModal(true);
  };

  const handleDeleteMeter = (meter: Meter) => {
    setSelectedMeter(meter);
    setShowDeleteModal(true);
  };
  
  const handleConfirmDelete = async () => {
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
      
      setShowDeleteModal(false);
      setSelectedMeter(null);
    } catch (error) {
      console.error('Error deleting meter:', error);
      setError('Failed to delete meter. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveMeter = async (meterData: Meter) => {
    try {
      setLoading(true);
      
      if (shouldUseMockApi()) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (showAddModal) {
          // Add new meter
          const newMeter: Meter = {
            ...meterData,
            id: `${meters.length + 1}`,
            customer_name: clients.find(c => c.id === meterData.client_id)?.name || '',
            property_name: 'New Property',
            credit_balance: 0,
            last_reading: 0,
            last_reading_date: new Date().toISOString(),
            valve_status: 'open'
          };
          
          setMeters([...meters, newMeter]);
        } else if (showEditModal && selectedMeter) {
          // Update existing meter
          const updatedMeters = meters.map(meter => 
            meter.id === selectedMeter.id 
              ? { ...meter, ...meterData } 
              : meter
          );
          
          setMeters(updatedMeters);
        }
      } else {
        // Use real API
        if (showAddModal) {
          await api.post('/meters', meterData);
        } else if (showEditModal && selectedMeter) {
          await api.put(`/meters/${selectedMeter.id}`, meterData);
        }
        
        await fetchMeters();
      }
      
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedMeter(null);
    } catch (error) {
      console.error('Error saving meter:', error);
      setError('Failed to save meter. Please try again later.');
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
  
  const handleExportMeters = () => {
    // Define custom headers for the CSV
    const headers = [
      { key: 'id' as keyof Meter, label: 'ID' },
      { key: 'meter_id' as keyof Meter, label: 'Meter ID' },
      { key: 'customer_name' as keyof Meter, label: 'Customer' },
      { key: 'property_name' as keyof Meter, label: 'Property' },
      { key: 'client_name' as keyof Meter, label: 'Client' },
      { key: 'status' as keyof Meter, label: 'Status' },
      { key: 'credit_balance' as keyof Meter, label: 'Credit Balance' },
      { key: 'last_reading' as keyof Meter, label: 'Last Reading' },
      { key: 'last_reading_date' as keyof Meter, label: 'Last Reading Date' },
      { key: 'installation_date' as keyof Meter, label: 'Installation Date' },
      { key: 'firmware_version' as keyof Meter, label: 'Firmware Version' },
      { key: 'model' as keyof Meter, label: 'Model' },
      { key: 'valve_status' as keyof Meter, label: 'Valve Status' }
    ];
    
    // Generate filename with timestamp
    const filename = generateFilename('meters_export');
    
    // Download the CSV
    downloadCSV(filteredMeters, filename, headers);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
        title={t('meters.management')}
        description={t('meters.managementDescription')}
        actions={
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleExportMeters}>
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              {t('common.export')}
            </Button>
            <Button onClick={handleAddMeter}>
              <PlusIcon className="h-4 w-4 mr-2" />
              {t('meters.addMeter')}
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
      
      {/* Meter Modals */}
      <MeterModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        mode="add"
        onSave={handleSaveMeter}
        clients={clients}
      />
      
      <MeterModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        mode="edit"
        meter={selectedMeter}
        onSave={handleSaveMeter}
        clients={clients}
      />
      
      <MeterModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        mode="view"
        meter={selectedMeter}
        clients={clients}
      />
      
      {/* Delete Confirmation Dialog */}
      {selectedMeter && (
        <div className={`fixed inset-0 bg-black bg-opacity-25 z-50 flex items-center justify-center ${showDeleteModal ? 'block' : 'hidden'}`}>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Confirm Deletion</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Are you sure you want to delete meter <span className="font-semibold">{selectedMeter.meter_id}</span>? This action cannot be undone.
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
                  placeholder="Search meters..."
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
                <option value="offline">Offline</option>
                <option value="maintenance">Maintenance</option>
              </select>
              <button
                type="button"
                onClick={fetchMeters}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Meters Table */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        {filteredMeters.length === 0 ? (
          <div className="px-4 py-5 sm:p-6 text-center">
            <CpuChipIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No meters found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Get started by adding a new meter.'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleAddMeter}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Meter
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
                    Meter ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Property
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Client
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Credit Balance
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Last Reading
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Valve
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedMeters.map((meter) => (
                  <tr key={meter.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                      {meter.meter_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {meter.customer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {meter.property_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {meter.client_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <MeterStatusBadge status={meter.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {meter.credit_balance ? formatCurrency(meter.credit_balance) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      <div className="flex flex-col">
                        <span>{meter.last_reading ? `${meter.last_reading} L` : '-'}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {meter.last_reading_date ? formatDate(meter.last_reading_date) : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {meter.valve_status ? <ValveStatusBadge status={meter.valve_status} /> : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleViewMeter(meter)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEditMeter(meter)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteMeter(meter)}
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
      {filteredMeters.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredMeters.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default MetersManagement;
