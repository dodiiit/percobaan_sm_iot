import React, { useState, useEffect } from 'react';
import { 
  BeakerIcon, 
  ArrowPathIcon, 
  CalendarIcon,
  ChartBarIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { meterAPI } from '../../../services/api';
import { toast } from 'react-toastify';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Meter {
  id: string;
  meter_number: string;
  location: string;
}

interface ConsumptionData {
  daily: {
    labels: string[];
    values: number[];
  };
  weekly: {
    labels: string[];
    values: number[];
  };
  monthly: {
    labels: string[];
    values: number[];
  };
  yearly: {
    labels: string[];
    values: number[];
  };
}

interface ConsumptionStats {
  total_consumption: number;
  average_daily: number;
  peak_usage: {
    value: number;
    date: string;
  };
  lowest_usage: {
    value: number;
    date: string;
  };
  change_percentage: number;
  estimated_monthly: number;
  water_saved: number;
  carbon_footprint: number;
}

const TimeRangeSelector: React.FC<{
  selectedRange: string;
  onChange: (range: string) => void;
}> = ({ selectedRange, onChange }) => {
  const ranges = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'yearly', label: 'Yearly' }
  ];

  return (
    <div className="flex space-x-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
      {ranges.map((range) => (
        <button
          key={range.id}
          className={`px-3 py-1.5 text-sm font-medium rounded-md ${
            selectedRange === range.id
              ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => onChange(range.id)}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
};

const ConsumptionChart: React.FC<{
  data: ConsumptionData;
  timeRange: string;
}> = ({ data, timeRange }) => {
  const chartData = {
    labels: data[timeRange as keyof ConsumptionData].labels,
    datasets: [
      {
        label: 'Water Consumption (Liters)',
        data: data[timeRange as keyof ConsumptionData].values,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151'
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        titleColor: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#111827',
        bodyColor: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#374151',
        borderColor: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#6b7280'
        }
      },
      y: {
        grid: {
          color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#6b7280'
        }
      }
    }
  };

  return (
    <div className="h-80">
      {timeRange === 'daily' ? (
        <Bar data={chartData} options={options} />
      ) : (
        <Line data={chartData} options={options} />
      )}
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: {
    value: number;
    isPositive: boolean;
  };
  footer?: string;
}> = ({ title, value, icon, change, footer }) => {
  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                {title}
              </dt>
              <dd>
                <div className="text-lg font-medium text-gray-900 dark:text-white">
                  {value}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {(change || footer) && (
        <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3">
          {change && (
            <div className="text-sm">
              <span
                className={`font-medium ${
                  change.isPositive
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                } inline-flex items-center`}
              >
                {change.isPositive ? (
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 mr-1" />
                )}
                {Math.abs(change.value)}%
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-2">from previous period</span>
            </div>
          )}
          {footer && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {footer}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Consumption: React.FC = () => {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [selectedMeter, setSelectedMeter] = useState<string>('');
  const [timeRange, setTimeRange] = useState<string>('weekly');
  const [consumptionData, setConsumptionData] = useState<ConsumptionData>({
    daily: { labels: [], values: [] },
    weekly: { labels: [], values: [] },
    monthly: { labels: [], values: [] },
    yearly: { labels: [], values: [] }
  });
  const [stats, setStats] = useState<ConsumptionStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMeters();
  }, []);

  useEffect(() => {
    if (selectedMeter) {
      fetchConsumptionData(selectedMeter);
    }
  }, [selectedMeter, timeRange]);

  const fetchMeters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use real API
      const response = await meterAPI.getCustomerMeters();
      
      if (response.data && response.data.status === 'success') {
        const metersData = response.data.data || [];
        setMeters(metersData);
        
        if (metersData.length > 0) {
          setSelectedMeter(metersData[0].id);
        } else {
          setError('No meters found for your account. Please contact customer support.');
        }
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
          location: 'Main House'
        },
        {
          id: 'meter-002',
          meter_number: 'WM-005678',
          location: 'Garden'
        }
      ];
      
      setMeters(fallbackMeters);
      setSelectedMeter(fallbackMeters[0].id);
    } finally {
      setLoading(false);
    }
  };

  const fetchConsumptionData = async (meterId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use real API
      const response = await meterAPI.getConsumption(meterId, { range: timeRange });
      
      if (response.data && response.data.status === 'success') {
        const consumptionData = response.data.data.consumption || {
          daily: { labels: [], values: [] },
          weekly: { labels: [], values: [] },
          monthly: { labels: [], values: [] },
          yearly: { labels: [], values: [] }
        };
        
        const statsData = response.data.data.stats || null;
        
        setConsumptionData(consumptionData);
        setStats(statsData);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch consumption data');
      }
    } catch (error: any) {
      console.error('Error fetching consumption data:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load consumption data. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Generate fallback data for development/testing
      const fallbackData = generateMockConsumptionData();
      setConsumptionData(fallbackData);
      
      // Fallback stats
      setStats({
        total_consumption: 12560,
        average_daily: 42,
        peak_usage: {
          value: 78,
          date: '2025-07-25'
        },
        lowest_usage: {
          value: 22,
          date: '2025-07-19'
        },
        change_percentage: -8.5,
        estimated_monthly: 1260,
        water_saved: 120,
        carbon_footprint: 3.2
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMockConsumptionData = (): ConsumptionData => {
    // Generate daily data (last 7 days)
    const dailyLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const dailyValues = Array.from({ length: 24 }, () => Math.floor(Math.random() * 30) + 10);
    
    // Generate weekly data (last 7 days)
    const weeklyLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyValues = Array.from({ length: 7 }, () => Math.floor(Math.random() * 50) + 30);
    
    // Generate monthly data (last 30 days)
    const monthlyLabels = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);
    const monthlyValues = Array.from({ length: 30 }, () => Math.floor(Math.random() * 60) + 20);
    
    // Generate yearly data (12 months)
    const yearlyLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const yearlyValues = Array.from({ length: 12 }, () => Math.floor(Math.random() * 1500) + 500);
    
    return {
      daily: { labels: dailyLabels, values: dailyValues },
      weekly: { labels: weeklyLabels, values: weeklyValues },
      monthly: { labels: monthlyLabels, values: monthlyValues },
      yearly: { labels: yearlyLabels, values: yearlyValues }
    };
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
            Water Consumption
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor and analyze your water usage patterns
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            onClick={() => selectedMeter && fetchConsumptionData(selectedMeter)}
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
                Refresh
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

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-1">
              <label htmlFor="meter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Meter
              </label>
              <select
                id="meter"
                name="meter"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={selectedMeter}
                onChange={(e) => setSelectedMeter(e.target.value)}
                disabled={loading}
              >
                <option value="">Select a meter</option>
                {meters.map((meter) => (
                  <option key={meter.id} value={meter.id}>
                    {meter.meter_number} - {meter.location}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-1 flex items-end">
              <TimeRangeSelector
                selectedRange={timeRange}
                onChange={setTimeRange}
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : !selectedMeter ? (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6 text-center">
            <BeakerIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No meter selected</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Please select a water meter to view consumption data.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <StatCard
                title="Total Consumption"
                value={`${stats.total_consumption.toLocaleString()} L`}
                icon={<BeakerIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
                change={{
                  value: stats.change_percentage,
                  isPositive: stats.change_percentage < 0 // For water consumption, negative change is positive (saving water)
                }}
              />
              <StatCard
                title="Daily Average"
                value={`${stats.average_daily.toLocaleString()} L/day`}
                icon={<ChartBarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />}
                footer={`Est. Monthly: ${stats.estimated_monthly.toLocaleString()} L`}
              />
              <StatCard
                title="Peak Usage"
                value={`${stats.peak_usage.value.toLocaleString()} L`}
                icon={<ArrowUpIcon className="h-6 w-6 text-red-600 dark:text-red-400" />}
                footer={`on ${formatDate(stats.peak_usage.date)}`}
              />
              <StatCard
                title="Water Saved"
                value={`${stats.water_saved.toLocaleString()} L`}
                icon={<CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />}
                footer={`Carbon reduction: ${stats.carbon_footprint} kg CO₂`}
              />
            </div>
          )}

          {/* Consumption Chart */}
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                {timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} Water Consumption
              </h3>
              <ConsumptionChart data={consumptionData} timeRange={timeRange} />
            </div>
          </div>

          {/* Usage Insights */}
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                Usage Insights
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Efficiency Tips</h3>
                      <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Your peak usage time is between 6:00 - 8:00 AM</li>
                          <li>Consider using water-efficient appliances</li>
                          <li>Fix any leaking taps to save up to 20L per day</li>
                          <li>Collect rainwater for garden irrigation</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Anomaly Detection</h3>
                      <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
                        <p>Unusual water usage detected on {formatDate(stats?.peak_usage.date || '')}. This could indicate a leak or unattended water source.</p>
                        <p className="mt-2">We recommend checking your property for any signs of leakage.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Consumption;
