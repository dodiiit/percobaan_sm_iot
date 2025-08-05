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
import api from '../../../services/api';
import { mockApi, shouldUseMockApi } from '../../../services/mockApi';
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
import { motion } from 'framer-motion';
import { 
  ConsumptionPatterns, 
  HourlyConsumptionHeatmap, 
  WaterUsageComparison,
  WaterSavingsInsights 
} from '../../../components/visualizations';
import { fadeIn, fadeInUp, staggerContainer } from '../../../utils/animations';
import { useBreakpoint } from '../../../utils/responsive';
import { useAnnounce } from '../../../utils/accessibility';

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
  hourly?: {
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
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
            selectedRange === range.id
              ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => onChange(range.id)}
          aria-pressed={selectedRange === range.id}
          aria-label={`View ${range.label} data`}
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
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    },
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
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-all duration-300 hover:shadow-md">
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
                  <ArrowUpIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 mr-1" aria-hidden="true" />
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
    yearly: { labels: [], values: [] },
    hourly: { labels: [], values: [] }
  });
  const [stats, setStats] = useState<ConsumptionStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hourlyHeatmapData, setHourlyHeatmapData] = useState<any[]>([]);
  const [comparisonData, setComparisonData] = useState<any>({
    labels: [],
    yourUsage: [],
    averageUsage: [],
    efficientUsage: []
  });
  const [savingsData, setSavingsData] = useState<any>({
    waterSaved: 0,
    moneySaved: 0,
    co2Reduced: 0,
    timeSpan: 30
  });
  
  const breakpoint = useBreakpoint();
  const { announce, AnnouncementRegion } = useAnnounce();

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
      
      let response;
      
      if (shouldUseMockApi()) {
        // Use mock data
        response = {
          data: {
            status: 'success',
            data: [
              {
                id: 'meter-001',
                meter_number: 'M-001',
                location: 'Main House'
              },
              {
                id: 'meter-002',
                meter_number: 'M-002',
                location: 'Garden'
              },
              {
                id: 'meter-003',
                meter_number: 'M-003',
                location: 'Pool House'
              }
            ]
          }
        };
      } else {
        // Use real API
        response = await api.get('/meters/my-meters');
      }
      
      if (response.data.status === 'success') {
        setMeters(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedMeter(response.data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching meters:', error);
      toast.error('Failed to load meters. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchConsumptionData = async (meterId: string) => {
    try {
      setLoading(true);
      
      let response;
      
      if (shouldUseMockApi()) {
        // Generate mock data
        const mockData = generateMockConsumptionData();
        response = {
          data: {
            status: 'success',
            data: {
              consumption: mockData,
              stats: {
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
              }
            }
          }
        };
      } else {
        // Use real API
        response = await api.get(`/meters/${meterId}/consumption?range=${timeRange}`);
      }
      
      if (response.data.status === 'success') {
        setConsumptionData(response.data.data.consumption);
        setStats(response.data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching consumption data:', error);
      toast.error('Failed to load consumption data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateMockConsumptionData = (): ConsumptionData => {
    // Generate hourly data (24 hours)
    const hourlyLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const hourlyValues = Array.from({ length: 24 }, () => Math.floor(Math.random() * 30) + 10);
    
    // Generate daily data (last 24 hours)
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
    
    // Generate hourly heatmap data
    const heatmapData = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        // Create a pattern where mornings and evenings have higher usage
        let baseValue = 10;
        if ((hour >= 6 && hour <= 9) || (hour >= 18 && hour <= 22)) {
          baseValue = 30; // Higher usage during morning and evening routines
        } else if (hour >= 23 || hour <= 5) {
          baseValue = 5; // Lower usage during night
        }
        
        // Add some randomness
        const value = baseValue + Math.floor(Math.random() * 15);
        
        heatmapData.push({
          day,
          hour,
          value
        });
      }
    }
    setHourlyHeatmapData(heatmapData);
    
    // Generate comparison data
    const comparisonLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const yourUsage = weeklyValues;
    const averageUsage = Array.from({ length: 7 }, (_, i) => {
      // Make average usage slightly higher than user's usage for most days
      return yourUsage[i] * (Math.random() * 0.4 + 0.9);
    });
    const efficientUsage = Array.from({ length: 7 }, (_, i) => {
      // Make efficient usage lower than user's usage
      return yourUsage[i] * (Math.random() * 0.2 + 0.6);
    });
    
    setComparisonData({
      labels: comparisonLabels,
      yourUsage,
      averageUsage,
      efficientUsage
    });
    
    // Generate savings data
    const waterSaved = Math.floor(Math.random() * 1000) + 500; // 500-1500 liters
    const moneySaved = Math.floor(waterSaved * 0.01 * 100) / 100; // Approximate cost savings
    const co2Reduced = Math.floor(waterSaved * 0.0005 * 100) / 100; // Approximate CO2 reduction
    
    setSavingsData({
      waterSaved,
      moneySaved,
      co2Reduced,
      timeSpan: 30
    });
    
    return {
      hourly: { labels: hourlyLabels, values: hourlyValues },
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
      {/* Accessibility announcement region */}
      <AnnouncementRegion />
      
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="md:flex md:items-center md:justify-between mb-6"
      >
        <motion.div variants={fadeInUp} className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            Water Consumption
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor and analyze your water usage patterns
          </p>
        </motion.div>
        <motion.div variants={fadeInUp} className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            onClick={() => {
              if (selectedMeter) {
                fetchConsumptionData(selectedMeter);
                announce("Refreshing consumption data");
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600 transition-colors duration-200"
            aria-label="Refresh data"
          >
            <ArrowPathIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500 dark:text-gray-400" />
            Refresh
          </button>
        </motion.div>
      </motion.div>

      <motion.div 
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-6"
      >
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
                onChange={(e) => {
                  setSelectedMeter(e.target.value);
                  if (e.target.value) {
                    const selectedOption = e.target.options[e.target.selectedIndex];
                    announce(`Selected meter: ${selectedOption.text}`);
                  }
                }}
                disabled={loading}
                aria-label="Select water meter"
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
                onChange={(range) => {
                  setTimeRange(range);
                  announce(`Time range changed to ${range}`);
                }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center items-center h-64"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" aria-label="Loading data"></div>
        </motion.div>
      ) : !selectedMeter ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg"
        >
          <div className="px-4 py-5 sm:p-6 text-center">
            <BeakerIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" aria-hidden="true" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No meter selected</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Please select a water meter to view consumption data.
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Stats Cards */}
          {stats && (
            <motion.div 
              variants={fadeInUp}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6"
            >
              <StatCard
                title="Total Consumption"
                value={`${stats.total_consumption.toLocaleString()} L`}
                icon={<BeakerIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />}
                change={{
                  value: stats.change_percentage,
                  isPositive: stats.change_percentage < 0 // For water consumption, negative change is positive (saving water)
                }}
              />
              <StatCard
                title="Daily Average"
                value={`${stats.average_daily.toLocaleString()} L/day`}
                icon={<ChartBarIcon className="h-6 w-6 text-green-600 dark:text-green-400" aria-hidden="true" />}
                footer={`Est. Monthly: ${stats.estimated_monthly.toLocaleString()} L`}
              />
              <StatCard
                title="Peak Usage"
                value={`${stats.peak_usage.value.toLocaleString()} L`}
                icon={<ArrowUpIcon className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />}
                footer={`on ${formatDate(stats.peak_usage.date)}`}
              />
              <StatCard
                title="Lowest Usage"
                value={`${stats.lowest_usage.value.toLocaleString()} L`}
                icon={<ArrowDownIcon className="h-6 w-6 text-green-600 dark:text-green-400" aria-hidden="true" />}
                footer={`on ${formatDate(stats.lowest_usage.date)}`}
              />
            </motion.div>
          )}

          {/* Enhanced Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Consumption Patterns */}
            <motion.div variants={fadeInUp}>
              <ConsumptionPatterns 
                data={consumptionData} 
                timeRange={timeRange} 
              />
            </motion.div>
            
            {/* Water Usage Comparison */}
            <motion.div variants={fadeInUp}>
              <WaterUsageComparison 
                data={comparisonData}
              />
            </motion.div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Hourly Consumption Heatmap */}
            <motion.div variants={fadeInUp}>
              <HourlyConsumptionHeatmap 
                data={hourlyHeatmapData}
              />
            </motion.div>
            
            {/* Water Savings Insights */}
            <motion.div variants={fadeInUp}>
              <WaterSavingsInsights 
                data={savingsData}
              />
            </motion.div>
          </div>

          {/* Original Consumption Chart (kept for backward compatibility) */}
          <motion.div 
            variants={fadeInUp}
            className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-6"
          >
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                Water Consumption Over Time
              </h3>
              <div className="h-80">
                <ConsumptionChart data={consumptionData} timeRange={timeRange} />
              </div>
            </div>
          </motion.div>

          {/* Usage Breakdown */}
          <motion.div 
            variants={fadeInUp}
            className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-6"
          >
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                Usage Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Water Efficiency
                  </h4>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden" role="progressbar" aria-valuenow={Math.min(100, 100 - stats?.change_percentage || 0)} aria-valuemin={0} aria-valuemax={100}>
                    <div 
                      className="bg-blue-600 h-4 rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${Math.min(100, 100 - stats?.change_percentage || 0)}%` }}
                    ></div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {stats?.change_percentage && stats.change_percentage < 0 
                      ? `You're using ${Math.abs(stats.change_percentage).toFixed(1)}% less water than before.`
                      : `You're using ${stats?.change_percentage?.toFixed(1) || 0}% more water than before.`
                    }
                  </p>
                </div>
                <div>
                  <h4 className="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Environmental Impact
                  </h4>
                  <div className="flex items-center">
                    <div className="flex-1">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats?.water_saved?.toLocaleString() || 0} L
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Water saved
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats?.carbon_footprint?.toLocaleString() || 0} kg
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        CO₂ reduction
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Consumption;