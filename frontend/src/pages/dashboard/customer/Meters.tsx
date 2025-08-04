import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BeakerIcon, 
  CpuChipIcon, 
  ArrowPathIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BoltIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import { meterAPI } from '../../../services/api';
import { toast } from 'react-toastify';

interface Meter {
  id: string;
  meter_number: string;
  location: string;
  installation_date: string;
  last_reading_date: string;
  credit_balance: number;
  status: string;
  last_reading: number;
  daily_average: number;
  monthly_average: number;
  signal_strength: number;
  battery_level: number;
  firmware_version: string;
}

const MeterStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let bgColor = '';
  let textColor = '';
  let icon = null;
  let label = '';

  switch (status) {
    case 'active':
      bgColor = 'bg-green-100 dark:bg-green-900/20';
      textColor = 'text-green-800 dark:text-green-400';
      icon = <CheckCircleIcon className="h-4 w-4 mr-1" />;
      label = 'Active';
      break;
    case 'inactive':
      bgColor = 'bg-gray-100 dark:bg-gray-700';
      textColor = 'text-gray-800 dark:text-gray-400';
      icon = <ClockIcon className="h-4 w-4 mr-1" />;
      label = 'Inactive';
      break;
    case 'low_credit':
      bgColor = 'bg-yellow-100 dark:bg-yellow-900/20';
      textColor = 'text-yellow-800 dark:text-yellow-400';
      icon = <ExclamationTriangleIcon className="h-4 w-4 mr-1" />;
      label = 'Low Credit';
      break;
    case 'error':
      bgColor = 'bg-red-100 dark:bg-red-900/20';
      textColor = 'text-red-800 dark:text-red-400';
      icon = <ExclamationTriangleIcon className="h-4 w-4 mr-1" />;
      label = 'Error';
      break;
    case 'maintenance':
      bgColor = 'bg-blue-100 dark:bg-blue-900/20';
      textColor = 'text-blue-800 dark:text-blue-400';
      icon = <ArrowPathIcon className="h-4 w-4 mr-1" />;
      label = 'Maintenance';
      break;
    default:
      bgColor = 'bg-gray-100 dark:bg-gray-700';
      textColor = 'text-gray-800 dark:text-gray-400';
      icon = <ClockIcon className="h-4 w-4 mr-1" />;
      label = status.charAt(0).toUpperCase() + status.slice(1);
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {icon}
      {label}
    </span>
  );
};

const SignalStrengthIndicator: React.FC<{ strength: number }> = ({ strength }) => {
  const bars = [];
  const maxBars = 4;
  
  for (let i = 0; i < maxBars; i++) {
    const isActive = i < Math.ceil(strength * maxBars / 100);
    bars.push(
      <div 
        key={i} 
        className={`w-1 mx-px rounded-sm ${isActive ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`}
        style={{ height: `${(i + 1) * 3}px` }}
      />
    );
  }
  
  return (
    <div className="flex items-end h-3">
      {bars}
    </div>
  );
};

const BatteryLevelIndicator: React.FC<{ level: number }> = ({ level }) => {
  let color = 'bg-red-500 dark:bg-red-400';
  
  if (level > 20) color = 'bg-yellow-500 dark:bg-yellow-400';
  if (level > 50) color = 'bg-green-500 dark:bg-green-400';
  
  return (
    <div className="w-8 h-4 border border-gray-400 dark:border-gray-500 rounded-sm relative flex items-center">
      <div 
        className={`absolute left-0 top-0 bottom-0 ${color}`} 
        style={{ width: `${level}%` }}
      />
      <div className="absolute w-1 h-2 bg-gray-400 dark:bg-gray-500 right-[-4px] rounded-r-sm" />
    </div>
  );
};

const Meters: React.FC = () => {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);
  const [showMeterDetails, setShowMeterDetails] = useState<boolean>(false);

  useEffect(() => {
    fetchMeters();
  }, []);

  const fetchMeters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use real API
      const response = await meterAPI.getCustomerMeters();
      
      if (response.data && response.data.status === 'success') {
        const metersData = response.data.data || [];
        setMeters(metersData);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch meters data');
      }
    } catch (error: any) {
      console.error('Error fetching meters:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load meters. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Fallback data for development/testing
      const fallbackMeters = [
        {
          id: 'meter-001',
          meter_number: 'WM-001234',
          location: 'Main House',
          installation_date: '2024-05-15',
          last_reading_date: '2025-07-30',
          credit_balance: 75000,
          status: 'active',
          last_reading: 1250,
          daily_average: 42,
          monthly_average: 1260,
          signal_strength: 85,
          battery_level: 72,
          firmware_version: '2.3.1'
        },
        {
          id: 'meter-002',
          meter_number: 'WM-005678',
          location: 'Garden',
          installation_date: '2024-05-15',
          last_reading_date: '2025-07-30',
          credit_balance: 25000,
          status: 'low_credit',
          last_reading: 850,
          daily_average: 28,
          monthly_average: 840,
          signal_strength: 92,
          battery_level: 65,
          firmware_version: '2.3.1'
        }
      ];
      
      setMeters(fallbackMeters);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshMeter = async (meterId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Call the API to refresh meter data
      await meterAPI.getStatus(meterId);
      
      // Refresh all meters
      await fetchMeters();
      
      toast.success('Meter data refreshed successfully');
    } catch (error: any) {
      console.error('Error refreshing meter:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to refresh meter data. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleMeterClick = (meter: Meter) => {
    setSelectedMeter(meter);
    setShowMeterDetails(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            My Water Meters
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage and monitor your smart water meters
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            onClick={() => fetchMeters()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                Refreshing...
              </>
            ) : (
              <>
                <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" />
                Refresh All
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Error display */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : meters.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6 text-center">
            <BeakerIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No meters found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              You don't have any water meters registered to your account.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {meters.map((meter) => (
            <div
              key={meter.id}
              className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow duration-200"
              onClick={() => handleMeterClick(meter)}
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 rounded-md p-3">
                      <BeakerIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                        {meter.meter_number}
                      </h3>
                      <div className="flex items-center mt-1">
                        <MapPinIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {meter.location}
                        </p>
                      </div>
                    </div>
                  </div>
                  <MeterStatusBadge status={meter.status} />
                </div>
                
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Credit Balance</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                      Rp {meter.credit_balance.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Reading</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                      {meter.last_reading} L
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Daily Average</p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {meter.daily_average} L/day
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</p>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {formatDate(meter.last_reading_date)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-4 sm:px-6 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <BoltIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1" />
                    <SignalStrengthIndicator strength={meter.signal_strength} />
                  </div>
                  <div className="flex items-center">
                    <BatteryLevelIndicator level={meter.battery_level} />
                    <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">{meter.battery_level}%</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRefreshMeter(meter.id);
                  }}
                  className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white dark:hover:bg-gray-500"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500"></div>
                  ) : (
                    <>
                      <ArrowPathIcon className="h-3 w-3 mr-1" />
                      Refresh
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Meter Details Modal */}
      {showMeterDetails && selectedMeter && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowMeterDetails(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 sm:mx-0 sm:h-10 sm:w-10">
                    <BeakerIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                      Meter Details: {selectedMeter.meter_number}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Detailed information about your water meter.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Meter Number</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{selectedMeter.meter_number}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{selectedMeter.location}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        <MeterStatusBadge status={selectedMeter.status} />
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Credit Balance</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">Rp {selectedMeter.credit_balance.toLocaleString()}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Installation Date</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(selectedMeter.installation_date)}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Reading Date</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(selectedMeter.last_reading_date)}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Reading</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{selectedMeter.last_reading} L</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Daily Average</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{selectedMeter.daily_average} L/day</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Average</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{selectedMeter.monthly_average} L/month</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Signal Strength</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                        <SignalStrengthIndicator strength={selectedMeter.signal_strength} />
                        <span className="ml-2">{selectedMeter.signal_strength}%</span>
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Battery Level</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                        <BatteryLevelIndicator level={selectedMeter.battery_level} />
                        <span className="ml-2">{selectedMeter.battery_level}%</span>
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Firmware Version</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{selectedMeter.firmware_version}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Link
                  to="/dashboard/customer/topup"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <BanknotesIcon className="h-4 w-4 mr-2" />
                  Top Up Credit
                </Link>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white dark:hover:bg-gray-500"
                  onClick={() => setShowMeterDetails(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Meters;
