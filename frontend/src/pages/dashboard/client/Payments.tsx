import React, { useState, useEffect, Fragment } from 'react';
import { 
  CreditCardIcon, 
  PlusIcon, 
  MagnifyingGlassIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition, Menu } from '@headlessui/react';
import DialogOverlay from "../../../components/ui/DialogOverlay";
import { ChevronDownIcon, EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import api from '../../../services/api';
import { mockApi, shouldUseMockApi } from '../../../services/mockApi';
import { toast } from 'react-toastify';

interface Payment {
  id: string;
  payment_id: string;
  customer_id: string;
  customer_name: string;
  meter_id: string;
  meter_name: string;
  amount: number;
  payment_method: string;
  status: string;
  description: string;
  created_at: string;
  updated_at: string;
  payment_url?: string;
  invoice_url?: string;
}

const PaymentStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let bgColor = '';
  let textColor = '';
  let icon = null;
  
  switch (status) {
    case 'success':
    case 'completed':
      bgColor = 'bg-green-100 dark:bg-green-900/20';
      textColor = 'text-green-800 dark:text-green-400';
      icon = <CheckCircleIcon className="h-4 w-4 mr-1" />;
      break;
    case 'failed':
    case 'cancelled':
      bgColor = 'bg-red-100 dark:bg-red-900/20';
      textColor = 'text-red-800 dark:text-red-400';
      icon = <XCircleIcon className="h-4 w-4 mr-1" />;
      break;
    case 'pending':
    case 'processing':
      bgColor = 'bg-yellow-100 dark:bg-yellow-900/20';
      textColor = 'text-yellow-800 dark:text-yellow-400';
      icon = <ClockIcon className="h-4 w-4 mr-1" />;
      break;
    case 'expired':
      bgColor = 'bg-gray-100 dark:bg-gray-700';
      textColor = 'text-gray-800 dark:text-gray-400';
      icon = <ExclamationTriangleIcon className="h-4 w-4 mr-1" />;
      break;
    default:
      bgColor = 'bg-gray-100 dark:bg-gray-700';
      textColor = 'text-gray-800 dark:text-gray-400';
      icon = <ClockIcon className="h-4 w-4 mr-1" />;
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const PaymentMethodIcon: React.FC<{ method: string }> = ({ method }) => {
  switch (method.toLowerCase()) {
    case 'credit_card':
    case 'credit card':
      return <CreditCardIcon className="h-5 w-5 text-blue-500" />;
    case 'bank_transfer':
    case 'bank transfer':
      return <BanknotesIcon className="h-5 w-5 text-green-500" />;
    case 'e-wallet':
    case 'ewallet':
      return <CreditCardIcon className="h-5 w-5 text-purple-500" />;
    default:
      return <CreditCardIcon className="h-5 w-5 text-gray-500" />;
  }
};

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    meter_id: '',
    amount: 100000,
    payment_method: 'bank_transfer',
    description: 'Water credit top-up'
  });
  const [customers, setCustomers] = useState<{id: string, name: string}[]>([]);
  const [meters, setMeters] = useState<{id: string, name: string}[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchPayments();
    fetchCustomers();
    fetchMeters();
  }, []);

  useEffect(() => {
    let filtered = payments;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(payment => 
        payment.payment_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.meter_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredPayments(filtered);
  }, [searchQuery, payments, statusFilter]);

  const fetchPayments = async () => {
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
                id: 'pay-001',
                payment_id: 'INV-20240715-001',
                customer_id: 'cust-001',
                customer_name: 'John Doe',
                meter_id: 'meter-001',
                meter_name: 'MTR000001',
                amount: 250000,
                payment_method: 'bank_transfer',
                status: 'success',
                description: 'Water credit top-up',
                created_at: '2024-07-15T14:20:00',
                updated_at: '2024-07-15T14:25:00',
                payment_url: 'https://example.com/pay/inv-001',
                invoice_url: 'https://example.com/invoice/inv-001'
              },
              {
                id: 'pay-002',
                payment_id: 'INV-20240720-002',
                customer_id: 'cust-002',
                customer_name: 'Jane Smith',
                meter_id: 'meter-002',
                meter_name: 'MTR000002',
                amount: 120000,
                payment_method: 'credit_card',
                status: 'success',
                description: 'Water credit top-up',
                created_at: '2024-07-20T10:15:00',
                updated_at: '2024-07-20T10:18:00',
                payment_url: 'https://example.com/pay/inv-002',
                invoice_url: 'https://example.com/invoice/inv-002'
              },
              {
                id: 'pay-003',
                payment_id: 'INV-20240725-003',
                customer_id: 'cust-004',
                customer_name: 'Siti Nurhayati',
                meter_id: 'meter-004',
                meter_name: 'MTR000004',
                amount: 320000,
                payment_method: 'bank_transfer',
                status: 'success',
                description: 'Water credit top-up',
                created_at: '2024-07-25T09:10:00',
                updated_at: '2024-07-25T09:30:00',
                payment_url: 'https://example.com/pay/inv-003',
                invoice_url: 'https://example.com/invoice/inv-003'
              },
              {
                id: 'pay-004',
                payment_id: 'INV-20240730-004',
                customer_id: 'cust-003',
                customer_name: 'Ahmad Rahman',
                meter_id: 'meter-003',
                meter_name: 'MTR000003',
                amount: 100000,
                payment_method: 'e-wallet',
                status: 'pending',
                description: 'Water credit top-up',
                created_at: '2024-07-30T16:45:00',
                updated_at: '2024-07-30T16:45:00',
                payment_url: 'https://example.com/pay/inv-004'
              },
              {
                id: 'pay-005',
                payment_id: 'INV-20240729-005',
                customer_id: 'cust-005',
                customer_name: 'Budi Santoso',
                meter_id: 'meter-005',
                meter_name: 'MTR000005',
                amount: 150000,
                payment_method: 'bank_transfer',
                status: 'failed',
                description: 'Water credit top-up',
                created_at: '2024-07-29T11:30:00',
                updated_at: '2024-07-29T11:40:00',
                payment_url: 'https://example.com/pay/inv-005'
              },
              {
                id: 'pay-006',
                payment_id: 'INV-20240728-006',
                customer_id: 'cust-001',
                customer_name: 'John Doe',
                meter_id: 'meter-001',
                meter_name: 'MTR000001',
                amount: 200000,
                payment_method: 'credit_card',
                status: 'expired',
                description: 'Water credit top-up',
                created_at: '2024-07-28T08:20:00',
                updated_at: '2024-07-29T08:20:00',
                payment_url: 'https://example.com/pay/inv-006'
              }
            ]
          }
        };
      } else {
        // Use real API
        response = await api.get('/payments');
      }
      
      if (response.data.status === 'success') {
        setPayments(response.data.data);
        setFilteredPayments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments. Please try again.');
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

  const fetchMeters = async () => {
    try {
      let response;
      
      if (shouldUseMockApi()) {
        // Use mock data
        response = {
          data: {
            status: 'success',
            data: [
              { id: 'meter-001', name: 'MTR000001' },
              { id: 'meter-002', name: 'MTR000002' },
              { id: 'meter-003', name: 'MTR000003' },
              { id: 'meter-004', name: 'MTR000004' },
              { id: 'meter-005', name: 'MTR000005' }
            ]
          }
        };
      } else {
        // Use real API
        response = await api.get('/meters');
      }
      
      if (response.data.status === 'success') {
        setMeters(response.data.data.map((meter: any) => ({
          id: meter.id,
          name: meter.meter_id || meter.name
        })));
      }
    } catch (error) {
      console.error('Error fetching meters:', error);
    }
  };

  const handleCreatePayment = async () => {
    try {
      setLoading(true);
      
      if (shouldUseMockApi()) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const newPayment: Payment = {
          id: `pay-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
          payment_id: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
          customer_id: formData.customer_id,
          customer_name: customers.find(c => c.id === formData.customer_id)?.name || '',
          meter_id: formData.meter_id,
          meter_name: meters.find(m => m.id === formData.meter_id)?.name || '',
          amount: formData.amount,
          payment_method: formData.payment_method,
          status: 'pending',
          description: formData.description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          payment_url: `https://example.com/pay/inv-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
        };
        
        setPayments([newPayment, ...payments]);
        setSelectedPayment(newPayment);
        setIsCreateModalOpen(false);
        setIsViewModalOpen(true);
      } else {
        // Use real API
        const response = await api.post('/payments', formData);
        
        if (response.data.status === 'success') {
          setSelectedPayment(response.data.data);
          setIsCreateModalOpen(false);
          setIsViewModalOpen(true);
          await fetchPayments();
        }
      }
      
      resetForm();
      toast.success('Payment created successfully');
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Failed to create payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openViewModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsViewModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      meter_id: '',
      amount: 100000,
      payment_method: 'bank_transfer',
      description: 'Water credit top-up'
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'amount' ? Number(value) : value }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'credit_card':
        return 'Credit Card';
      case 'e-wallet':
        return 'E-Wallet';
      default:
        return method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            Payments
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage customer payments and credit top-ups
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Create Payment
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
                  placeholder="Search payments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                id="status-filter"
                name="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="expired">Expired</option>
              </select>
              <button
                type="button"
                onClick={fetchPayments}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
              >
                <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="px-4 py-5 sm:p-6 text-center">
              <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No payments found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchQuery || statusFilter !== 'all' ? 'Try different search terms or filters.' : 'Get started by creating a new payment.'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Create Payment
                  </button>
                </div>
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Payment ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Method
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900/20 rounded-full">
                          <CreditCardIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {payment.payment_id}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {payment.meter_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{payment.customer_name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{payment.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(payment.amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <PaymentMethodIcon method={payment.payment_method} />
                        <span className="ml-1.5 text-sm text-gray-900 dark:text-white">
                          {getPaymentMethodLabel(payment.payment_method)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PaymentStatusBadge status={payment.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(payment.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openViewModal(payment)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Payment Modal */}
      <Transition.Root show={isCreateModalOpen} as={Fragment}>
        <Dialog as="div" className="fixed z-10 inset-0 overflow-y-auto" onClose={setIsCreateModalOpen}>
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
                    <CreditCardIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Create New Payment
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Fill in the details to create a new payment for meter credit top-up.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6">
                  <form className="space-y-4">
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
                      <label htmlFor="meter_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Meter
                      </label>
                      <select
                        id="meter_id"
                        name="meter_id"
                        value={formData.meter_id}
                        onChange={handleInputChange}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      >
                        <option value="">Select Meter</option>
                        {meters.map(meter => (
                          <option key={meter.id} value={meter.id}>{meter.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Amount (IDR)
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 dark:text-gray-400 sm:text-sm">Rp</span>
                        </div>
                        <input
                          type="number"
                          name="amount"
                          id="amount"
                          value={formData.amount}
                          onChange={handleInputChange}
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="0"
                          min="10000"
                          step="10000"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="payment_method" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Payment Method
                      </label>
                      <select
                        id="payment_method"
                        name="payment_method"
                        value={formData.payment_method}
                        onChange={handleInputChange}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="credit_card">Credit Card</option>
                        <option value="e-wallet">E-Wallet</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        rows={2}
                        value={formData.description}
                        onChange={handleInputChange}
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Payment description"
                      />
                    </div>
                  </form>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                    onClick={handleCreatePayment}
                    disabled={!formData.customer_id || !formData.meter_id || formData.amount < 10000}
                  >
                    Create Payment
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    onClick={() => {
                      setIsCreateModalOpen(false);
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

      {/* View Payment Modal */}
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
                {selectedPayment && (
                  <>
                    <div>
                      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20">
                        <CreditCardIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                      </div>
                      <div className="mt-3 text-center sm:mt-5">
                        <Dialog.Title as="h3" className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                          Payment Details
                        </Dialog.Title>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {selectedPayment.payment_id}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 sm:mt-6">
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md mb-4">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status:</span>
                          <PaymentStatusBadge status={selectedPayment.status} />
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(selectedPayment.amount)}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Method:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{getPaymentMethodLabel(selectedPayment.payment_method)}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Customer:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedPayment.customer_name}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Meter:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedPayment.meter_name}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Created:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(selectedPayment.created_at)}</span>
                        </div>
                        {selectedPayment.updated_at !== selectedPayment.created_at && (
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Updated:</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(selectedPayment.updated_at)}</span>
                          </div>
                        )}
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Description:</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedPayment.description}</span>
                        </div>
                      </div>

                      {selectedPayment.status === 'pending' && selectedPayment.payment_url && (
                        <div className="mb-4">
                          <a
                            href={selectedPayment.payment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <EyeIcon className="-ml-1 mr-2 h-5 w-5" />
                            Open Payment Page
                          </a>
                        </div>
                      )}

                      {selectedPayment.status === 'success' && selectedPayment.invoice_url && (
                        <div className="mb-4">
                          <a
                            href={selectedPayment.invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <DocumentTextIcon className="-ml-1 mr-2 h-5 w-5" />
                            View Invoice
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="mt-5 sm:mt-6">
                      <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
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

export default Payments;
