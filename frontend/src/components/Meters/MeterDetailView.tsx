import React from 'react';
import { 
  CpuChipIcon, 
  UserIcon, 
  HomeIcon, 
  BuildingOfficeIcon,
  BanknotesIcon,
  BeakerIcon,
  CalendarIcon,
  CodeBracketIcon,
  DeviceTabletIcon,
  BoltIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface Meter {
  id: string;
  meter_id: string;
  customer_name: string;
  customer_id: string;
  property_name: string;
  property_id: string;
  client_name: string;
  client_id: string;
  status: 'active' | 'inactive' | 'offline' | 'maintenance';
  credit_balance: number;
  last_reading: number;
  last_reading_date: string;
  installation_date: string;
  firmware_version: string;
  model: string;
  valve_status: 'open' | 'closed';
}

interface MeterDetailViewProps {
  meter: Meter;
}

const MeterDetailView: React.FC<MeterDetailViewProps> = ({ meter }) => {
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
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 dark:text-green-400';
      case 'inactive':
        return 'text-red-600 dark:text-red-400';
      case 'offline':
        return 'text-gray-600 dark:text-gray-400';
      case 'maintenance':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getValveStatusColor = (status: string) => {
    return status === 'open' 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-red-600 dark:text-red-400';
  };

  const getValveStatusIcon = (status: string) => {
    return status === 'open' 
      ? <BoltIcon className="h-5 w-5 mr-2" /> 
      : <XCircleIcon className="h-5 w-5 mr-2" />;
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            {t('meters.details')}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            {t('meters.detailsDescription')}
          </p>
        </div>
        <div className="flex items-center">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(meter.status)} bg-opacity-10`}>
            {meter.status.charAt(0).toUpperCase() + meter.status.slice(1)}
          </span>
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700">
        <dl>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <CpuChipIcon className="h-5 w-5 mr-2" />
              {t('meters.meterId')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {meter.meter_id}
            </dd>
          </div>
          <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              {t('meters.customer')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {meter.customer_name}
            </dd>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <HomeIcon className="h-5 w-5 mr-2" />
              {t('meters.property')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {meter.property_name}
            </dd>
          </div>
          <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <BuildingOfficeIcon className="h-5 w-5 mr-2" />
              {t('meters.client')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {meter.client_name}
            </dd>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <BanknotesIcon className="h-5 w-5 mr-2" />
              {t('meters.creditBalance')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {formatCurrency(meter.credit_balance)}
            </dd>
          </div>
          <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <BeakerIcon className="h-5 w-5 mr-2" />
              {t('meters.lastReading')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {meter.last_reading} L ({formatDateTime(meter.last_reading_date)})
            </dd>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              {t('meters.installationDate')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {formatDate(meter.installation_date)}
            </dd>
          </div>
          <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <CodeBracketIcon className="h-5 w-5 mr-2" />
              {t('meters.firmwareVersion')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {meter.firmware_version}
            </dd>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              <DeviceTabletIcon className="h-5 w-5 mr-2" />
              {t('meters.model')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
              {meter.model}
            </dd>
          </div>
          <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
              {getValveStatusIcon(meter.valve_status)}
              {t('meters.valveStatus')}
            </dt>
            <dd className={`mt-1 text-sm font-medium sm:mt-0 sm:col-span-2 ${getValveStatusColor(meter.valve_status)}`}>
              {meter.valve_status.charAt(0).toUpperCase() + meter.valve_status.slice(1)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default MeterDetailView;