import React from 'react';
import { 
  UserIcon, 
  CpuChipIcon, 
  BanknotesIcon, 
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ReceiptRefundIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface Payment {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_id: string;
  meter_id: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  payment_date: string;
  due_date: string;
  payment_method: string;
  transaction_id: string;
  description: string;
  consumption: number;
  period_start: string;
  period_end: string;
  created_at: string;
}

interface PaymentDetailViewProps {
  payment: Payment;
}

const PaymentDetailView: React.FC<PaymentDetailViewProps> = ({ payment }) => {
  const { t } = useTranslation();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 dark:text-green-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      case 'refunded':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-400" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 mr-2 text-red-600 dark:text-red-400" />;
      case 'refunded':
        return <ReceiptRefundIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-gray-600 dark:text-gray-400" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            {t('payments.details')}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            {t('payments.detailsDescription')}
          </p>
        </div>
        <div className="flex items-center">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(payment.status)} bg-opacity-10`}>
            {getStatusIcon(payment.status)}
            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
          </span>
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700">
        <dl>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              {t('payments.invoiceNumber')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {payment.invoice_number}
            </dd>
          </div>
          <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              {t('payments.customer')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {payment.customer_name}
            </dd>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <CpuChipIcon className="h-5 w-5 mr-2" />
              {t('payments.meterId')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {payment.meter_id}
            </dd>
          </div>
          <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <BanknotesIcon className="h-5 w-5 mr-2" />
              {t('payments.amount')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {formatCurrency(payment.amount)}
            </dd>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              {t('payments.paymentDate')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {formatDate(payment.payment_date)}
            </dd>
          </div>
          <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              {t('payments.dueDate')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {formatDate(payment.due_date)}
            </dd>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <CreditCardIcon className="h-5 w-5 mr-2" />
              {t('payments.paymentMethod')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {payment.payment_method}
            </dd>
          </div>
          <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              {t('payments.transactionId')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {payment.transaction_id || 'N/A'}
            </dd>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              {t('payments.billingPeriod')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {formatDate(payment.period_start)} - {formatDate(payment.period_end)}
            </dd>
          </div>
          <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <BeakerIcon className="h-5 w-5 mr-2" />
              {t('payments.consumption')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {payment.consumption} L
            </dd>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              {t('payments.description')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {payment.description || 'N/A'}
            </dd>
          </div>
          <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              {t('payments.createdAt')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {formatDate(payment.created_at)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default PaymentDetailView;