import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import MeterDetailView from './MeterDetailView';
import { Meter } from '../../types';

interface Client {
  id: string;
  name: string;
}

interface Customer {
  id: string;
  name: string;
  client_id: string;
}

interface Property {
  id: string;
  name: string;
  client_id: string;
  customer_id: string;
}

interface MeterModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit' | 'view';
  meter?: Meter | null;
  onSave?: (meter: Meter) => void;
  clients: Client[];
}

const MeterModal: React.FC<MeterModalProps> = ({
  isOpen,
  onClose,
  mode,
  meter,
  onSave,
  clients
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Meter>({
    id: '',
    meter_id: '',
    customer_id: '',
    property_id: '',
    client_id: '',
    customer_name: '',
    client_name: '',
    status: 'active',
    installation_date: new Date().toISOString().split('T')[0],
    firmware_version: '',
    model: '',
    last_reading: 0,
    last_reading_date: new Date().toISOString()
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);

  useEffect(() => {
    if (meter && (mode === 'edit' || mode === 'view')) {
      setFormData({
        ...meter
      });
    } else {
      // Reset form for add mode
      setFormData({
        id: '',
        meter_id: '',
        customer_id: '',
        property_id: '',
        client_id: '',
        customer_name: '',
        client_name: '',
        status: 'active',
        installation_date: new Date().toISOString().split('T')[0],
        firmware_version: '',
        model: '',
        last_reading: 0,
        last_reading_date: new Date().toISOString()
      });
    }
  }, [meter, mode, isOpen]);

  useEffect(() => {
    // Fetch customers and properties
    // In a real implementation, this would be an API call
    // For now, we'll use mock data
    const mockCustomers: Customer[] = [
      { id: 'CUST-001', name: 'John Doe', client_id: 'CLIENT-001' },
      { id: 'CUST-002', name: 'Jane Smith', client_id: 'CLIENT-001' },
      { id: 'CUST-003', name: 'Bob Johnson', client_id: 'CLIENT-002' },
      { id: 'CUST-004', name: 'Alice Brown', client_id: 'CLIENT-002' },
      { id: 'CUST-005', name: 'Charlie Davis', client_id: 'CLIENT-003' }
    ];
    
    const mockProperties: Property[] = [
      { id: 'PROP-001', name: 'Green Residence A-12', client_id: 'CLIENT-001', customer_id: 'CUST-001' },
      { id: 'PROP-002', name: 'Blue Apartment B-05', client_id: 'CLIENT-001', customer_id: 'CUST-001' },
      { id: 'PROP-003', name: 'Red Villa C-08', client_id: 'CLIENT-001', customer_id: 'CUST-002' },
      { id: 'PROP-004', name: 'Yellow House D-15', client_id: 'CLIENT-002', customer_id: 'CUST-003' },
      { id: 'PROP-005', name: 'Purple Condo E-22', client_id: 'CLIENT-002', customer_id: 'CUST-004' },
      { id: 'PROP-006', name: 'Orange Mansion F-30', client_id: 'CLIENT-003', customer_id: 'CUST-005' }
    ];
    
    setCustomers(mockCustomers);
    setProperties(mockProperties);
  }, []);

  useEffect(() => {
    // Filter customers by client
    if (formData.client_id) {
      const filtered = customers.filter(customer => customer.client_id === formData.client_id);
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers([]);
    }
  }, [formData.client_id, customers]);

  useEffect(() => {
    // Filter properties by customer
    if (formData.customer_id) {
      const filtered = properties.filter(property => property.customer_id === formData.customer_id);
      setFilteredProperties(filtered);
    } else {
      setFilteredProperties([]);
    }
  }, [formData.customer_id, properties]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors for the field being changed
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Reset dependent fields
    if (name === 'client_id') {
      setFormData(prev => ({ ...prev, customer_id: '', property_id: '' }));
    } else if (name === 'customer_id') {
      setFormData(prev => ({ ...prev, property_id: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.meter_id) {
      newErrors.meter_id = 'Meter ID is required';
    }
    
    if (!formData.client_id) {
      newErrors.client_id = 'Client is required';
    }
    
    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required';
    }
    
    if (!formData.property_id) {
      newErrors.property_id = 'Property is required';
    }
    
    if (!formData.installation_date) {
      newErrors.installation_date = 'Installation date is required';
    }
    
    if (!formData.firmware_version) {
      newErrors.firmware_version = 'Firmware version is required';
    }
    
    if (!formData.model) {
      newErrors.model = 'Model is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'view') {
      onClose();
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real implementation, this would be an API call
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onSave) {
        onSave(formData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving meter:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'add':
        return t('meters.addMeter');
      case 'edit':
        return t('meters.editMeter');
      case 'view':
        return t('meters.viewMeter');
      default:
        return '';
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 dark:bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    {getModalTitle()}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {mode === 'view' && meter ? (
                  <div>
                    <MeterDetailView meter={meter as any} />
                    <div className="mt-6 flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-1">
                        <label htmlFor="meter_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Meter ID
                        </label>
                        <input
                          type="text"
                          name="meter_id"
                          id="meter_id"
                          value={formData.meter_id}
                          onChange={handleChange}
                          className={`mt-1 block w-full rounded-md ${
                            errors.meter_id ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                          } shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                        />
                        {errors.meter_id && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.meter_id}</p>
                        )}
                      </div>

                      <div className="col-span-1">
                        <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Client
                        </label>
                        <select
                          name="client_id"
                          id="client_id"
                          value={formData.client_id}
                          onChange={handleChange}
                          className={`mt-1 block w-full rounded-md ${
                            errors.client_id ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                          } shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                        >
                          <option value="">Select Client</option>
                          {clients.map(client => (
                            <option key={client.id} value={client.id}>{client.name}</option>
                          ))}
                        </select>
                        {errors.client_id && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.client_id}</p>
                        )}
                      </div>

                      <div className="col-span-1">
                        <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Customer
                        </label>
                        <select
                          name="customer_id"
                          id="customer_id"
                          value={formData.customer_id}
                          onChange={handleChange}
                          disabled={!formData.client_id}
                          className={`mt-1 block w-full rounded-md ${
                            errors.customer_id ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                          } shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                        >
                          <option value="">Select Customer</option>
                          {filteredCustomers.map(customer => (
                            <option key={customer.id} value={customer.id}>{customer.name}</option>
                          ))}
                        </select>
                        {errors.customer_id && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.customer_id}</p>
                        )}
                      </div>

                      <div className="col-span-1">
                        <label htmlFor="property_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Property
                        </label>
                        <select
                          name="property_id"
                          id="property_id"
                          value={formData.property_id}
                          onChange={handleChange}
                          disabled={!formData.customer_id}
                          className={`mt-1 block w-full rounded-md ${
                            errors.property_id ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                          } shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                        >
                          <option value="">Select Property</option>
                          {filteredProperties.map(property => (
                            <option key={property.id} value={property.id}>{property.name}</option>
                          ))}
                        </select>
                        {errors.property_id && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.property_id}</p>
                        )}
                      </div>

                      <div className="col-span-1">
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Status
                        </label>
                        <select
                          name="status"
                          id="status"
                          value={formData.status}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="offline">Offline</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </div>

                      <div className="col-span-1">
                        <label htmlFor="installation_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Installation Date
                        </label>
                        <input
                          type="date"
                          name="installation_date"
                          id="installation_date"
                          value={formData.installation_date ? formData.installation_date.split('T')[0] : ''}
                          onChange={handleChange}
                          className={`mt-1 block w-full rounded-md ${
                            errors.installation_date ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                          } shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                        />
                        {errors.installation_date && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.installation_date}</p>
                        )}
                      </div>

                      <div className="col-span-1">
                        <label htmlFor="firmware_version" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Firmware Version
                        </label>
                        <input
                          type="text"
                          name="firmware_version"
                          id="firmware_version"
                          value={formData.firmware_version}
                          onChange={handleChange}
                          className={`mt-1 block w-full rounded-md ${
                            errors.firmware_version ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                          } shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                        />
                        {errors.firmware_version && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firmware_version}</p>
                        )}
                      </div>

                      <div className="col-span-1">
                        <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Model
                        </label>
                        <input
                          type="text"
                          name="model"
                          id="model"
                          value={formData.model}
                          onChange={handleChange}
                          className={`mt-1 block w-full rounded-md ${
                            errors.model ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                          } shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                        />
                        {errors.model && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.model}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        loading={loading}
                      >
                        {mode === 'add' ? 'Add Meter' : 'Save Changes'}
                      </Button>
                    </div>
                  </form>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default MeterModal;