import React, { useState, useEffect } from 'react';
import { useApiState, usePaginatedApiState, usePollingApiState } from '../../hooks/useApiState';
import enhancedMeterService, { Meter, MeterStatus } from '../../services/enhancedMeterService';
import enhancedRealtimeService from '../../services/enhancedRealtimeService';
import { handleApiError } from '../../services/errorHandler';
import { toast } from 'react-toastify';

interface EnhancedMeterDashboardProps {
  customerId?: string;
}

const EnhancedMeterDashboard: React.FC<EnhancedMeterDashboardProps> = ({ customerId }) => {
  const [selectedMeterId, setSelectedMeterId] = useState<string>('');
  const [realtimeSubscriptionId, setRealtimeSubscriptionId] = useState<string>('');

  // Fetch meters with pagination
  const {
    data: meters,
    loading: metersLoading,
    error: metersError,
    pagination,
    loadMore,
    refresh: refreshMeters
  } = usePaginatedApiState(
    (page, limit) => enhancedMeterService.getMeters({ page, limit, customer_id: customerId }),
    {
      immediate: true,
      initialLimit: 10,
      errorConfig: {
        showToast: true,
        logError: true
      },
      errorContext: {
        component: 'EnhancedMeterDashboard',
        action: 'fetchMeters'
      }
    }
  );

  // Fetch selected meter status with polling
  const {
    data: meterStatus,
    loading: statusLoading,
    error: statusError,
    isPolling,
    startPolling,
    stopPolling
  } = usePollingApiState(
    () => enhancedMeterService.getMeterStatus(selectedMeterId),
    {
      enabled: !!selectedMeterId,
      interval: 5000, // Poll every 5 seconds
      maxRetries: 3,
      errorConfig: {
        showToast: false, // Don't show toast for polling errors
        logError: true
      }
    }
  );

  // Fetch meter statistics
  const {
    data: meterStats,
    loading: statsLoading,
    error: statsError,
    execute: fetchStats
  } = useApiState(
    () => enhancedMeterService.getMeterStats(selectedMeterId, 'month'),
    {
      dependencies: [selectedMeterId],
      immediate: false,
      errorConfig: {
        showToast: true
      }
    }
  );

  // Handle meter selection
  const handleMeterSelect = async (meter: Meter) => {
    try {
      // Stop previous polling
      if (isPolling) {
        stopPolling();
      }

      // Unsubscribe from previous real-time updates
      if (realtimeSubscriptionId) {
        await enhancedRealtimeService.unsubscribe(realtimeSubscriptionId);
        setRealtimeSubscriptionId('');
      }

      setSelectedMeterId(meter.id);

      // Start polling for new meter
      startPolling();

      // Fetch statistics
      await fetchStats();

      // Subscribe to real-time updates
      const subscriptionId = await enhancedRealtimeService.subscribeMeterUpdates(
        meter.id,
        (realtimeData) => {
          console.log('Real-time meter data:', realtimeData);
          toast.info(`Meter ${meter.meter_number} updated`);
        },
        (error) => {
          handleApiError(error, {
            showToast: true,
            logError: true
          }, {
            component: 'EnhancedMeterDashboard',
            action: 'realtimeSubscription'
          });
        }
      );

      setRealtimeSubscriptionId(subscriptionId);
      toast.success(`Connected to meter ${meter.meter_number}`);

    } catch (error) {
      handleApiError(error as any, {
        showToast: true,
        logError: true
      }, {
        component: 'EnhancedMeterDashboard',
        action: 'selectMeter'
      });
    }
  };

  // Handle meter control
  const handleMeterControl = async (action: 'open' | 'close') => {
    if (!selectedMeterId) return;

    try {
      await enhancedMeterService.controlMeter(selectedMeterId, action);
      toast.success(`Meter valve ${action}ed successfully`);
      
      // Refresh status after control action
      setTimeout(() => {
        // Status will be updated by polling
      }, 2000);

    } catch (error) {
      handleApiError(error as any, {
        showToast: true,
        logError: true
      }, {
        component: 'EnhancedMeterDashboard',
        action: 'controlMeter'
      });
    }
  };

  // Handle credit top-up
  const handleTopUp = async (amount: number) => {
    if (!selectedMeterId) return;

    try {
      await enhancedMeterService.topUpCredit(selectedMeterId, amount, 'Dashboard top-up');
      toast.success(`Credit topped up successfully: $${amount}`);
      
      // Refresh meter data
      await refreshMeters();

    } catch (error) {
      handleApiError(error as any, {
        showToast: true,
        logError: true
      }, {
        component: 'EnhancedMeterDashboard',
        action: 'topUpCredit'
      });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (realtimeSubscriptionId) {
        enhancedRealtimeService.unsubscribe(realtimeSubscriptionId);
      }
    };
  }, [realtimeSubscriptionId]);

  // Render loading state
  if (metersLoading && meters.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading meters...</span>
      </div>
    );
  }

  // Render error state
  if (metersError && meters.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Failed to load meters
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{metersError.message}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={refreshMeters}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Enhanced Meter Dashboard</h2>
        <button
          onClick={refreshMeters}
          disabled={metersLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {metersLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Meters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {meters.map((meter) => (
          <div
            key={meter.id}
            className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all ${
              selectedMeterId === meter.id ? 'ring-2 ring-blue-500' : 'hover:shadow-lg'
            }`}
            onClick={() => handleMeterSelect(meter)}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {meter.meter_number}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                meter.status === 'active' ? 'bg-green-100 text-green-800' :
                meter.status === 'offline' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {meter.status}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Credit Balance:</span>
                <span className="text-sm font-medium">${meter.credit_balance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Reading:</span>
                <span className="text-sm font-medium">{meter.last_reading} L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Customer:</span>
                <span className="text-sm font-medium">{meter.customer?.name}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {pagination.hasMore && (
        <div className="text-center">
          <button
            onClick={loadMore}
            disabled={metersLoading}
            className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            {metersLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {/* Selected Meter Details */}
      {selectedMeterId && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Meter Details
              {isPolling && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Live
                </span>
              )}
            </h3>
            <div className="space-x-2">
              <button
                onClick={() => handleMeterControl('open')}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Open Valve
              </button>
              <button
                onClick={() => handleMeterControl('close')}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Close Valve
              </button>
              <button
                onClick={() => handleTopUp(50)}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                Top Up $50
              </button>
            </div>
          </div>

          {/* Meter Status */}
          {statusLoading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : statusError ? (
            <div className="text-red-600 text-sm">
              Failed to load status: {statusError.message}
            </div>
          ) : meterStatus ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-600">Status</div>
                <div className="font-medium">{meterStatus.status}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-600">Signal Strength</div>
                <div className="font-medium">{meterStatus.signal_strength}%</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-600">Battery Level</div>
                <div className="font-medium">{meterStatus.battery_level || 'N/A'}%</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-600">Valve Status</div>
                <div className="font-medium">{meterStatus.valve_status || 'Unknown'}</div>
              </div>
            </div>
          ) : null}

          {/* Meter Statistics */}
          {statsLoading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ) : statsError ? (
            <div className="text-red-600 text-sm">
              Failed to load statistics: {statsError.message}
              <button
                onClick={fetchStats}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                Retry
              </button>
            </div>
          ) : meterStats ? (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">Monthly Statistics</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-sm text-blue-600">Daily Consumption</div>
                  <div className="text-lg font-bold text-blue-900">{meterStats.daily_consumption} L</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-sm text-green-600">Weekly Consumption</div>
                  <div className="text-lg font-bold text-green-900">{meterStats.weekly_consumption} L</div>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <div className="text-sm text-purple-600">Monthly Consumption</div>
                  <div className="text-lg font-bold text-purple-900">{meterStats.monthly_consumption} L</div>
                </div>
                <div className="bg-orange-50 p-3 rounded">
                  <div className="text-sm text-orange-600">Average Daily</div>
                  <div className="text-lg font-bold text-orange-900">{meterStats.average_daily_usage} L</div>
                </div>
                <div className="bg-indigo-50 p-3 rounded">
                  <div className="text-sm text-indigo-600">Peak Usage Time</div>
                  <div className="text-lg font-bold text-indigo-900">{meterStats.peak_usage_time}</div>
                </div>
                <div className="bg-pink-50 p-3 rounded">
                  <div className="text-sm text-pink-600">Efficiency Rating</div>
                  <div className="text-lg font-bold text-pink-900">{meterStats.efficiency_rating}%</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Connection Status */}
      <div className="bg-gray-50 rounded-md p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Connection Status</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              !metersError ? 'bg-green-400' : 'bg-red-400'
            }`}></div>
            <span>API: {!metersError ? 'Connected' : 'Error'}</span>
          </div>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              isPolling ? 'bg-green-400' : 'bg-gray-400'
            }`}></div>
            <span>Polling: {isPolling ? 'Active' : 'Inactive'}</span>
          </div>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              realtimeSubscriptionId ? 'bg-green-400' : 'bg-gray-400'
            }`}></div>
            <span>Real-time: {realtimeSubscriptionId ? 'Connected' : 'Disconnected'}</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full mr-2 bg-blue-400"></div>
            <span>Cache: Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMeterDashboard;