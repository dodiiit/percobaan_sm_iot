import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import CustomerDetailView from './CustomerDetailView';
import { Customer } from '../../types';

interface Client {
  id: string;
  name: string;
}

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit' | 'view';
  customer?: Customer | null;
  onSave?: (customer: Customer) => void;
  clients: Client[];
}

const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  mode,
  customer,
  onSave,
  clients
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Customer>({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    status: 'active',
    client_id: '',
    client_name: '',
    created_at: new Date().toISOString()
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customer && (mode === 'edit' || mode === 'view')) {
      setFormData({
        ...customer
      });
    } else {
      // Reset form for add mode
      setFormData({
        id: '',
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        status: 'active',
        client_id: '',
        client_name: '',
        created_at: new Date().toISOString()
      });
    }
  }, [customer, mode, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (!formData.address) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.city) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.client_id) {
      newErrors.client_id = 'Client is required';
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
      console.error('Error saving customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'add':
        return t('customers.addCustomer');
      case 'edit':
        return t('customers.editCustomer');
      case 'view':
        return t('customers.viewCustomer');
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

                {mode === 'view' && customer ? (
                  <div>
                    <CustomerDetailView customer={customer as any} />
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
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={mode === 'view'}
                        className={`mt-1 block w-full rounded-md ${
                          errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        } shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                      )}
                    </div>

                    <div className="col-span-1">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={mode === 'view'}
                        className={`mt-1 block w-full rounded-md ${
                          errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        } shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                      )}
                    </div>

                    <div className="col-span-1">
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Phone
                      </label>
                      <input
                        type="text"
                        name="phone"
                        id="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={mode === 'view'}
                        className={`mt-1 block w-full rounded-md ${
                          errors.phone ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        } shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
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
                        disabled={mode === 'view'}
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
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        id="city"
                        value={formData.city}
                        onChange={handleChange}
                        disabled={mode === 'view'}
                        className={`mt-1 block w-full rounded-md ${
                          errors.city ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        } shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                      />
                      {errors.city && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.city}</p>
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
                        disabled={mode === 'view'}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Address
                      </label>
                      <textarea
                        name="address"
                        id="address"
                        rows={3}
                        value={formData.address}
                        onChange={handleChange}
                        disabled={mode === 'view'}
                        className={`mt-1 block w-full rounded-md ${
                          errors.address ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        } shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white`}
                      />
                      {errors.address && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.address}</p>
                      )}
                    </div>

                    {mode === 'view' && (
                      <>
                        <div className="col-span-1">
                          <label htmlFor="meters_count" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Meters Count
                          </label>
                          <input
                            type="text"
                            name="meters_count"
                            id="meters_count"
                            value={formData.meters_count || 'N/A'}
                            disabled
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>

                        <div className="col-span-1">
                          <label htmlFor="properties_count" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Properties Count
                          </label>
                          <input
                            type="text"
                            name="properties_count"
                            id="properties_count"
                            value={formData.properties_count || 'N/A'}
                            disabled
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>

                        <div className="col-span-1">
                          <label htmlFor="total_consumption" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Total Consumption
                          </label>
                          <input
                            type="text"
                            name="total_consumption"
                            id="total_consumption"
                            value={formData.total_consumption ? `${formData.total_consumption} L` : 'N/A'}
                            disabled
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>

                        <div className="col-span-1">
                          <label htmlFor="last_payment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Last Payment
                          </label>
                          <input
                            type="text"
                            name="last_payment"
                            id="last_payment"
                            value={formData.last_payment_amount ? formatCurrency(formData.last_payment_amount) : 'N/A'}
                            disabled
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>

                        <div className="col-span-1">
                          <label htmlFor="last_payment_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Last Payment Date
                          </label>
                          <input
                            type="text"
                            name="last_payment_date"
                            id="last_payment_date"
                            value={formatDate(formData.last_payment_date)}
                            disabled
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>

                        <div className="col-span-1">
                          <label htmlFor="created_at" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Created At
                          </label>
                          <input
                            type="text"
                            name="created_at"
                            id="created_at"
                            value={formatDate(formData.created_at)}
                            disabled
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                      </>
                    )}
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
                      {mode === 'add' ? 'Add Customer' : 'Save Changes'}
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

export default CustomerModal;