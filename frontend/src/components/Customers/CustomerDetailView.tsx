import React from 'react';
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  HomeIcon, 
  BuildingOfficeIcon,
  CpuChipIcon,
  BanknotesIcon,
  BeakerIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { Customer } from '../../types';

interface CustomerDetailViewProps {
  customer: Customer;
}

const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({ customer }) => {
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
      case 'active':
        return 'text-green-600 dark:text-green-400';
      case 'inactive':
        return 'text-red-600 dark:text-red-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />;
      case 'inactive':
        return <XCircleIcon className="h-5 w-5 mr-2 text-red-600 dark:text-red-400" />;
      case 'pending':
        return <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-600 dark:text-yellow-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            {t('customers.details')}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            {t('customers.detailsDescription')}
          </p>
        </div>
        <div className="flex items-center">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(customer.status)} bg-opacity-10`}>
            {getStatusIcon(customer.status)}
            {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
          </span>
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700">
        <dl>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              {t('customers.name')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {customer.name}
            </dd>
          </div>
          <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <EnvelopeIcon className="h-5 w-5 mr-2" />
              {t('customers.email')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {customer.email}
            </dd>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <PhoneIcon className="h-5 w-5 mr-2" />
              {t('customers.phone')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {customer.phone}
            </dd>
          </div>
          <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <HomeIcon className="h-5 w-5 mr-2" />
              {t('customers.address')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {customer.address}, {customer.city}
            </dd>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <BuildingOfficeIcon className="h-5 w-5 mr-2" />
              {t('customers.client')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {customer.client_name}
            </dd>
          </div>
          <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <CpuChipIcon className="h-5 w-5 mr-2" />
              {t('customers.metersCount')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {customer.meters_count ?? 0}
            </dd>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <HomeIcon className="h-5 w-5 mr-2" />
              {t('customers.propertiesCount')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {customer.properties_count ?? 0}
            </dd>
          </div>
          <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <BeakerIcon className="h-5 w-5 mr-2" />
              {t('customers.totalConsumption')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {customer.total_consumption ?? 0} L
            </dd>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <BanknotesIcon className="h-5 w-5 mr-2" />
              {t('customers.lastPayment')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {customer.last_payment_amount && customer.last_payment_date 
                ? `${formatCurrency(customer.last_payment_amount)} (${formatDate(customer.last_payment_date)})`
                : '-'
              }
            </dd>
          </div>
          <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              {t('customers.createdAt')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {formatDate(customer.created_at)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default CustomerDetailView;