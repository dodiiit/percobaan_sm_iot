import React, { useState, useEffect } from 'react';
import { 
  CreditCardIcon, 
  PlusIcon, 
  MagnifyingGlassIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  CpuChipIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../../components/common/PageHeader';
import Button from '../../../components/ui/Button';
import Pagination from '../../../components/ui/Pagination';
import PaymentModal from '../../../components/Payments/PaymentModal';
import api from '../../../services/api';
import { mockApi, shouldUseMockApi } from '../../../services/mockApi';
import useRealTimeUpdates from '../../../hooks/useRealTimeUpdates';
import { downloadCSV, generateFilename } from '../../../utils/exportUtils';

interface Payment {
  id: string;
  transaction_id: string;
  customer_name: string;
  customer_id: string;
  meter_id: string;
  client_name: string;
  client_id: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  payment_method: string;
  payment_gateway: string;
  created_at: string;
  updated_at: string;
  description: string;
  receipt_url?: string;
}

const PaymentStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let bgColor = '';
  let textColor = '';
  let icon = null;
  
  switch (status) {
    case 'completed':
      bgColor = 'bg-green-100 dark:bg-green-900/20';
      textColor = 'text-green-800 dark:text-green-400';
      icon = <CheckCircleIcon className="h-4 w-4 mr-1" />;
      break;
    case 'pending':
      bgColor = 'bg-yellow-100 dark:bg-yellow-900/20';
      textColor = 'text-yellow-800 dark:text-yellow-400';
      icon = <ClockIcon className="h-4 w-4 mr-1" />;
      break;
    case 'failed':
      bgColor = 'bg-red-100 dark:bg-red-900/20';
      textColor = 'text-red-800 dark:text-red-400';
      icon = <XCircleIcon className="h-4 w-4 mr-1" />;
      break;
    case 'refunded':
      bgColor = 'bg-gray-100 dark:bg-gray-700';
      textColor = 'text-gray-800 dark:text-gray-400';
      icon = <ArrowDownTrayIcon className="h-4 w-4 mr-1" />;
      break;
    default:
      bgColor = 'bg-gray-100 dark:bg-gray-700';
      textColor = 'text-gray-800 dark:text-gray-400';
      icon = <ExclamationTriangleIcon className="h-4 w-4 mr-1" />;
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const PaymentsManagement: React.FC = () => {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [clients, setClients] = useState<{id: string, name: string}[]>([]);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paginatedPayments, setPaginatedPayments] = useState<Payment[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  
  // Real-time updates using SSE
  const { isConnected, error: sseError } = useRealTimeUpdates({
    url: '/api/payments/events',
    onMessage: (data) => {
      if (data.type === 'payment_created' || data.type === 'payment_updated' || data.type === 'payment_status_changed') {
        fetchPayments();
      }
    },
    enabled: false // Disabled by default, enable with a toggle
  });

  useEffect(() => {
    fetchPayments();
    fetchClients();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [searchQuery, statusFilter, clientFilter, dateFilter, payments]);
  
  // Apply pagination to filtered payments
  useEffect(() => {
    const totalPages = Math.ceil(filteredPayments.length / pageSize);
    setTotalPages(totalPages || 1);
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    setPaginatedPayments(filteredPayments.slice(startIndex, endIndex));
    
    // Reset to page 1 if current page is now invalid
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredPayments, currentPage, pageSize]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      
      if (shouldUseMockApi()) {
        // Use mock data
        const mockPayments: Payment[] = [
          {
            id: 'pay-001',
            transaction_id: 'TRX-20250801-001',
            customer_name: 'John Doe',
            customer_id: 'cust-001',
            meter_id: 'WM-001234',
            client_name: 'PT Water Jakarta',
            client_id: 'client-001',
            amount: 150000,
            status: 'completed',
            payment_method: 'Credit Card',
            payment_gateway: 'Midtrans',
            created_at: '2025-08-01T08:30:00Z',
            updated_at: '2025-08-01T08:35:00Z',
            description: 'Water credit top-up',
            receipt_url: 'https://example.com/receipts/TRX-20250801-001.pdf'
          },
          {
            id: 'pay-002',
            transaction_id: 'TRX-20250802-002',
            customer_name: 'Jane Smith',
            customer_id: 'cust-002',
            meter_id: 'WM-001235',
            client_name: 'PT Water Jakarta',
            client_id: 'client-001',
            amount: 120000,
            status: 'completed',
            payment_method: 'Bank Transfer',
            payment_gateway: 'Midtrans',
            created_at: '2025-08-02T10:15:00Z',
            updated_at: '2025-08-02T10:45:00Z',
            description: 'Water credit top-up',
            receipt_url: 'https://example.com/receipts/TRX-20250802-002.pdf'
          },
          {
            id: 'pay-003',
            transaction_id: 'TRX-20250803-003',
            customer_name: 'Ahmad Rahman',
            customer_id: 'cust-003',
            meter_id: 'WM-001236',
            client_name: 'Bandung Water Authority',
            client_id: 'client-002',
            amount: 180000,
            status: 'pending',
            payment_method: 'Bank Transfer',
            payment_gateway: 'Midtrans',
            created_at: '2025-08-03T09:45:00Z',
            updated_at: '2025-08-03T09:45:00Z',
            description: 'Water credit top-up'
          },
          {
            id: 'pay-004',
            transaction_id: 'TRX-20250803-004',
            customer_name: 'Siti Nurhayati',
            customer_id: 'cust-004',
            meter_id: 'WM-001237',
            client_name: 'Bandung Water Authority',
            client_id: 'client-002',
            amount: 200000,
            status: 'failed',
            payment_method: 'Credit Card',
            payment_gateway: 'DOKU',
            created_at: '2025-08-03T14:20:00Z',
            updated_at: '2025-08-03T14:25:00Z',
            description: 'Water credit top-up'
          },
          {
            id: 'pay-005',
            transaction_id: 'TRX-20250804-005',
            customer_name: 'Budi Santoso',
            customer_id: 'cust-005',
            meter_id: 'WM-001238',
            client_name: 'Surabaya Clean Water',
            client_id: 'client-003',
            amount: 250000,
            status: 'refunded',
            payment_method: 'E-Wallet',
            payment_gateway: 'DOKU',
            created_at: '2025-08-04T11:30:00Z',
            updated_at: '2025-08-04T15:45:00Z',
            description: 'Water credit top-up (refunded due to system error)',
            receipt_url: 'https://example.com/receipts/TRX-20250804-005.pdf'
          }
        ];
        
        setPayments(mockPayments);
        setFilteredPayments(mockPayments);
      } else {
        // Use real API
        response = await api.get('/payments');
        
        if (response.data.status === 'success') {
          setPayments(response.data.data);
          setFilteredPayments(response.data.data);
        } else {
          throw new Error('Failed to fetch payments');
        }
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError('Failed to load payments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

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

  const filterPayments = () => {
    let filtered = [...payments];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }
    
    // Apply client filter
    if (clientFilter !== 'all') {
      filtered = filtered.filter(payment => payment.client_id === clientFilter);
    }
    
    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(payment => {
            const paymentDate = new Date(payment.created_at);
            return paymentDate >= today;
          });
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          filtered = filtered.filter(payment => {
            const paymentDate = new Date(payment.created_at);
            return paymentDate >= weekAgo;
          });
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          filtered = filtered.filter(payment => {
            const paymentDate = new Date(payment.created_at);
            return paymentDate >= monthAgo;
          });
          break;
      }
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(payment => 
        payment.transaction_id.toLowerCase().includes(query) ||
        payment.customer_name.toLowerCase().includes(query) ||
        payment.meter_id.toLowerCase().includes(query) ||
        payment.payment_method.toLowerCase().includes(query)
      );
    }
    
    setFilteredPayments(filtered);
  };

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowViewModal(true);
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const handleExportPayments = () => {
    // Define custom headers for the CSV
    const headers = [
      { key: 'id' as keyof Payment, label: 'ID' },
      { key: 'transaction_id' as keyof Payment, label: 'Transaction ID' },
      { key: 'customer_name' as keyof Payment, label: 'Customer' },
      { key: 'meter_id' as keyof Payment, label: 'Meter ID' },
      { key: 'client_name' as keyof Payment, label: 'Client' },
      { key: 'amount' as keyof Payment, label: 'Amount' },
      { key: 'status' as keyof Payment, label: 'Status' },
      { key: 'payment_method' as keyof Payment, label: 'Payment Method' },
      { key: 'payment_gateway' as keyof Payment, label: 'Payment Gateway' },
      { key: 'created_at' as keyof Payment, label: 'Created At' },
      { key: 'updated_at' as keyof Payment, label: 'Updated At' },
      { key: 'description' as keyof Payment, label: 'Description' }
    ];
    
    // Generate filename with timestamp
    const filename = generateFilename('payments_export');
    
    // Download the CSV
    downloadCSV(filteredPayments, filename, headers);
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
        title={t('payments.management')}
        description={t('payments.managementDescription')}
        actions={
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleExportPayments}>
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              {t('common.export')}
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
            onClick={() => {
              const newUrl = new URL('/api/payments/events', window.location.origin);
              const newRealTimeUpdates = useRealTimeUpdates({
                url: newUrl.toString(),
                onMessage: (data) => {
                  if (data.type === 'payment_created' || data.type === 'payment_updated' || data.type === 'payment_status_changed') {
                    fetchPayments();
                  }
                },
                enabled: true
              });
            }}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isConnected ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
            role="switch"
            aria-checked={isConnected}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isConnected ? 'translate-x-5' : 'translate-x-0'
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
                  placeholder="Search payments..."
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
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
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
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
              <button
                type="button"
                onClick={fetchPayments}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        {filteredPayments.length === 0 ? (
          <div className="px-4 py-5 sm:p-6 text-center">
            <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No payments found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchQuery || statusFilter !== 'all' || clientFilter !== 'all' || dateFilter !== 'all' ? 'Try adjusting your filters.' : 'No payment transactions have been recorded yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Meter ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Client
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Method
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                      {payment.transaction_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {payment.customer_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900 dark:text-white">
                        <CpuChipIcon className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
                        {payment.meter_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {payment.client_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PaymentStatusBadge status={payment.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(payment.created_at)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatTime(payment.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col">
                        <span>{payment.payment_method}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          via {payment.payment_gateway}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleViewPayment(payment)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          View
                        </button>
                        {payment.receipt_url && (
                          <a
                            href={payment.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          >
                            Receipt
                          </a>
                        )}
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
      {filteredPayments.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredPayments.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        payment={selectedPayment}
      />
    </div>
  );
};

export default PaymentsManagement;
