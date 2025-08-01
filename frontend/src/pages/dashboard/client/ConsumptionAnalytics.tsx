import React, { useState, useEffect } from 'react';
import { 
  BeakerIcon, 
  ArrowPathIcon, 
  CalendarIcon,
  ChartBarIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  MapPinIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon,
  DocumentChartBarIcon,
  CloudArrowDownIcon
} from '@heroicons/react/24/outline';
import api from '../../../services/api';
import { mockApi, shouldUseMockApi } from '../../../services/mockApi';
import { toast } from 'react-toastify';
import { Line, Bar, Doughnut, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import PageHeader from '../../../components/common/PageHeader';
import Button from '../../../components/ui/Button';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Meter {
  id: string;
  meter_number: string;
  location: string;
  property_id: string;
  property_name: string;
  customer_id: string;
  customer_name: string;
  status: string;
  last_reading: number;
  last_reading_date: string;
}

interface Property {
  id: string;
  name: string;
  address: string;
  type: string;
  customer_id: string;
  customer_name: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
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
  hourly: {
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
    time?: string;
  };
  lowest_usage: {
    value: number;
    date: string;
    time?: string;
  };
  change_percentage: number;
  estimated_monthly: number;
  water_saved: number;
  carbon_footprint: number;
  peak_hours: string[];
  efficiency_score: number;
  anomalies_detected: number;
  leakage_probability: number;
}

interface UsagePattern {
  hour: number;
  day: number;
  value: number;
}

interface UsageBreakdown {
  category: string;
  percentage: number;
  value: number;
  color: string;
}

interface AnomalyData {
  date: string;
  time: string;
  value: number;
  expected_value: number;
  deviation_percentage: number;
  type: string;
  description: string;
  status: string;
}

interface ComparisonData {
  category: string;
  current_period: number;
  previous_period: number;
  change_percentage: number;
}

// Filter Component
const FilterPanel: React.FC<{
  customers: Customer[];
  properties: Property[];
  meters: Meter[];
  selectedCustomer: string;
  selectedProperty: string;
  selectedMeter: string;
  dateRange: { start: string; end: string };
  onCustomerChange: (id: string) => void;
  onPropertyChange: (id: string) => void;
  onMeterChange: (id: string) => void;
  onDateRangeChange: (range: { start: string; end: string }) => void;
}> = ({
  customers,
  properties,
  meters,
  selectedCustomer,
  selectedProperty,
  selectedMeter,
  dateRange,
  onCustomerChange,
  onPropertyChange,
  onMeterChange,
  onDateRangeChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredProperties = selectedCustomer
    ? properties.filter(p => p.customer_id === selectedCustomer)
    : properties;

  const filteredMeters = selectedProperty
    ? meters.filter(m => m.property_id === selectedProperty)
    : selectedCustomer
    ? meters.filter(m => m.customer_id === selectedCustomer)
    : meters;

  return (
    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-6">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Analytics Filters
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
          </button>
        </div>

        <div className={`grid grid-cols-1 gap-6 ${isExpanded ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2'}`}>
          <div>
            <label htmlFor="customer" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Customer
            </label>
            <select
              id="customer"
              name="customer"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={selectedCustomer}
              onChange={(e) => onCustomerChange(e.target.value)}
            >
              <option value="">All Customers</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="property" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Property
            </label>
            <select
              id="property"
              name="property"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={selectedProperty}
              onChange={(e) => onPropertyChange(e.target.value)}
              disabled={!selectedCustomer}
            >
              <option value="">All Properties</option>
              {filteredProperties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name} - {property.address}
                </option>
              ))}
            </select>
          </div>

          {isExpanded && (
            <div>
              <label htmlFor="meter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Meter
              </label>
              <select
                id="meter"
                name="meter"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={selectedMeter}
                onChange={(e) => onMeterChange(e.target.value)}
                disabled={!selectedProperty && !selectedCustomer}
              >
                <option value="">All Meters</option>
                {filteredMeters.map((meter) => (
                  <option key={meter.id} value={meter.id}>
                    {meter.meter_number} - {meter.location}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isExpanded && (
            <div>
              <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date Range
              </label>
              <div className="mt-1 flex space-x-2">
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={dateRange.start}
                  onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
                />
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={dateRange.end}
                  onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Time Range Selector Component
const TimeRangeSelector: React.FC<{
  selectedRange: string;
  onChange: (range: string) => void;
}> = ({ selectedRange, onChange }) => {
  const ranges = [
    { id: 'hourly', label: 'Hourly' },
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'yearly', label: 'Yearly' }
  ];

  return (
    <div className="flex space-x-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg overflow-x-auto">
      {ranges.map((range) => (
        <button
          key={range.id}
          className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap ${
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

// Consumption Chart Component
const ConsumptionChart: React.FC<{
  data: ConsumptionData;
  timeRange: string;
}> = ({ data, timeRange }) => {
  const chartData = {
    labels: data[timeRange as keyof ConsumptionData]?.labels || [],
    datasets: [
      {
        label: 'Water Consumption (Liters)',
        data: data[timeRange as keyof ConsumptionData]?.values || [],
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
      {timeRange === 'daily' || timeRange === 'hourly' ? (
        <Bar data={chartData} options={options} />
      ) : (
        <Line data={chartData} options={options} />
      )}
    </div>
  );
};

// Stat Card Component
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

// Usage Pattern Heatmap Component
const UsagePatternHeatmap: React.FC<{
  data: UsagePattern[];
}> = ({ data }) => {
  // Process data for heatmap
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  
  // Create a 2D array for the heatmap data
  const heatmapData = Array(7).fill(0).map(() => Array(24).fill(0));
  
  // Fill in the data
  data.forEach(item => {
    heatmapData[item.day][item.hour] = item.value;
  });
  
  // Find min and max for color scaling
  const allValues = data.map(item => item.value);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  
  // Function to get color based on value
  const getColor = (value: number) => {
    const normalizedValue = (value - minValue) / (maxValue - minValue);
    // Blue to red gradient
    const r = Math.floor(normalizedValue * 255);
    const b = Math.floor((1 - normalizedValue) * 255);
    return `rgb(${r}, 100, ${b})`;
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        <div className="flex mb-1">
          <div className="w-12"></div> {/* Empty corner cell */}
          {hours.map((hour, i) => (
            <div key={i} className="w-8 text-xs text-center text-gray-500 dark:text-gray-400">
              {i % 3 === 0 ? hour : ''}
            </div>
          ))}
        </div>
        
        {days.map((day, dayIndex) => (
          <div key={day} className="flex mb-1">
            <div className="w-12 text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
              {day}
            </div>
            {hours.map((_, hourIndex) => {
              const value = heatmapData[dayIndex][hourIndex];
              return (
                <div 
                  key={hourIndex} 
                  className="w-8 h-8 rounded-sm m-px flex items-center justify-center"
                  style={{ backgroundColor: getColor(value) }}
                  title={`${day} ${hourIndex}:00 - ${value} liters`}
                >
                  <span className="text-xs text-white font-medium">
                    {value > (maxValue * 0.7) ? value : ''}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
        
        <div className="flex items-center mt-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 mr-2">Low</div>
          <div className="h-2 w-32 bg-gradient-to-r from-blue-500 to-red-500 rounded"></div>
          <div className="text-xs text-gray-500 dark:text-gray-400 ml-2">High</div>
        </div>
      </div>
    </div>
  );
};

// Usage Breakdown Component
const UsageBreakdownChart: React.FC<{
  data: UsageBreakdown[];
}> = ({ data }) => {
  const chartData = {
    labels: data.map(item => item.category),
    datasets: [
      {
        data: data.map(item => item.percentage),
        backgroundColor: data.map(item => item.color),
        borderColor: data.map(item => item.color),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const dataItem = data[context.dataIndex];
            return `${label}: ${value}% (${dataItem.value.toLocaleString()} L)`;
          }
        }
      }
    },
  };

  return (
    <div className="h-64">
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

// Anomaly Table Component
const AnomalyTable: React.FC<{
  anomalies: AnomalyData[];
}> = ({ anomalies }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Date & Time
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Actual vs Expected
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Deviation
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          {anomalies.map((anomaly, index) => (
            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {anomaly.date} {anomaly.time}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {anomaly.type}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {anomaly.value.toLocaleString()} L vs {anomaly.expected_value.toLocaleString()} L
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  anomaly.deviation_percentage > 50 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                    : anomaly.deviation_percentage > 20
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {anomaly.deviation_percentage > 0 ? '+' : ''}{anomaly.deviation_percentage}%
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  anomaly.status === 'Resolved' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : anomaly.status === 'Investigating'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {anomaly.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Comparison Chart Component
const ComparisonChart: React.FC<{
  data: ComparisonData[];
}> = ({ data }) => {
  const chartData = {
    labels: data.map(item => item.category),
    datasets: [
      {
        label: 'Current Period',
        data: data.map(item => item.current_period),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: 'Previous Period',
        data: data.map(item => item.previous_period),
        backgroundColor: 'rgba(107, 114, 128, 0.5)',
        borderColor: 'rgb(107, 114, 128)',
        borderWidth: 1,
      },
    ],
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
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            return `${label}: ${value.toLocaleString()} L`;
          },
          afterBody: function(tooltipItems: any) {
            const dataIndex = tooltipItems[0].dataIndex;
            const change = data[dataIndex].change_percentage;
            return `Change: ${change > 0 ? '+' : ''}${change}%`;
          }
        }
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
      <Bar data={chartData} options={options} />
    </div>
  );
};

// Main Component
const ConsumptionAnalytics: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [selectedMeter, setSelectedMeter] = useState<string>('');
  const [timeRange, setTimeRange] = useState<string>('weekly');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0] // today
  });
  const [consumptionData, setConsumptionData] = useState<ConsumptionData>({
    daily: { labels: [], values: [] },
    weekly: { labels: [], values: [] },
    monthly: { labels: [], values: [] },
    yearly: { labels: [], values: [] },
    hourly: { labels: [], values: [] }
  });
  const [stats, setStats] = useState<ConsumptionStats | null>(null);
  const [usagePatterns, setUsagePatterns] = useState<UsagePattern[]>([]);
  const [usageBreakdown, setUsageBreakdown] = useState<UsageBreakdown[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyData[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedCustomer || selectedProperty || selectedMeter) {
      fetchAnalyticsData();
    }
  }, [selectedCustomer, selectedProperty, selectedMeter, timeRange, dateRange]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      let customersResponse, propertiesResponse, metersResponse;
      
      if (shouldUseMockApi()) {
        // Use mock data
        customersResponse = {
          data: {
            status: 'success',
            data: [
              { id: 'cust-001', name: 'John Doe', email: 'john@example.com', phone: '+62123456789' },
              { id: 'cust-002', name: 'Jane Smith', email: 'jane@example.com', phone: '+62987654321' },
              { id: 'cust-003', name: 'Bob Johnson', email: 'bob@example.com', phone: '+62456789123' }
            ]
          }
        };
        
        propertiesResponse = {
          data: {
            status: 'success',
            data: [
              { id: 'prop-001', name: 'Main Residence', address: 'Jl. Sudirman No. 123', type: 'Residential', customer_id: 'cust-001', customer_name: 'John Doe' },
              { id: 'prop-002', name: 'Vacation Home', address: 'Jl. Bali No. 45', type: 'Residential', customer_id: 'cust-001', customer_name: 'John Doe' },
              { id: 'prop-003', name: 'Office Building', address: 'Jl. Gatot Subroto No. 67', type: 'Commercial', customer_id: 'cust-002', customer_name: 'Jane Smith' },
              { id: 'prop-004', name: 'Restaurant', address: 'Jl. Thamrin No. 89', type: 'Commercial', customer_id: 'cust-003', customer_name: 'Bob Johnson' }
            ]
          }
        };
        
        metersResponse = {
          data: {
            status: 'success',
            data: [
              { id: 'meter-001', meter_number: 'M-001', location: 'Main House', property_id: 'prop-001', property_name: 'Main Residence', customer_id: 'cust-001', customer_name: 'John Doe', status: 'active', last_reading: 12560, last_reading_date: '2025-07-30' },
              { id: 'meter-002', meter_number: 'M-002', location: 'Garden', property_id: 'prop-001', property_name: 'Main Residence', customer_id: 'cust-001', customer_name: 'John Doe', status: 'active', last_reading: 5430, last_reading_date: '2025-07-30' },
              { id: 'meter-003', meter_number: 'M-003', location: 'Pool', property_id: 'prop-002', property_name: 'Vacation Home', customer_id: 'cust-001', customer_name: 'John Doe', status: 'offline', last_reading: 8970, last_reading_date: '2025-07-25' },
              { id: 'meter-004', meter_number: 'M-004', location: 'Main Supply', property_id: 'prop-003', property_name: 'Office Building', customer_id: 'cust-002', customer_name: 'Jane Smith', status: 'active', last_reading: 34560, last_reading_date: '2025-07-30' },
              { id: 'meter-005', meter_number: 'M-005', location: 'Kitchen', property_id: 'prop-004', property_name: 'Restaurant', customer_id: 'cust-003', customer_name: 'Bob Johnson', status: 'active', last_reading: 78900, last_reading_date: '2025-07-30' }
            ]
          }
        };
      } else {
        // Use real API
        [customersResponse, propertiesResponse, metersResponse] = await Promise.all([
          api.get('/customers'),
          api.get('/properties'),
          api.get('/meters')
        ]);
      }
      
      if (customersResponse.data.status === 'success') {
        setCustomers(customersResponse.data.data);
      }
      
      if (propertiesResponse.data.status === 'success') {
        setProperties(propertiesResponse.data.data);
      }
      
      if (metersResponse.data.status === 'success') {
        setMeters(metersResponse.data.data);
      }
      
      // Generate mock analytics data
      if (shouldUseMockApi()) {
        generateMockAnalyticsData();
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      if (shouldUseMockApi()) {
        // Generate mock analytics data
        generateMockAnalyticsData();
      } else {
        // Use real API
        let endpoint = '/analytics/consumption';
        const params = new URLSearchParams();
        
        if (selectedCustomer) params.append('customer_id', selectedCustomer);
        if (selectedProperty) params.append('property_id', selectedProperty);
        if (selectedMeter) params.append('meter_id', selectedMeter);
        params.append('time_range', timeRange);
        params.append('start_date', dateRange.start);
        params.append('end_date', dateRange.end);
        
        const response = await api.get(`${endpoint}?${params.toString()}`);
        
        if (response.data.status === 'success') {
          setConsumptionData(response.data.data.consumption);
          setStats(response.data.data.stats);
          setUsagePatterns(response.data.data.usage_patterns);
          setUsageBreakdown(response.data.data.usage_breakdown);
          setAnomalies(response.data.data.anomalies);
          setComparisonData(response.data.data.comparison);
        }
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateMockAnalyticsData = () => {
    // Generate consumption data
    const hourlyLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const hourlyValues = Array.from({ length: 24 }, () => Math.floor(Math.random() * 30) + 10);
    
    const dailyLabels = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - 6 + i);
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    });
    const dailyValues = Array.from({ length: 7 }, () => Math.floor(Math.random() * 50) + 30);
    
    const weeklyLabels = Array.from({ length: 4 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - 21 + (i * 7));
      return `Week ${i + 1}`;
    });
    const weeklyValues = Array.from({ length: 4 }, () => Math.floor(Math.random() * 300) + 200);
    
    const monthlyLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyValues = Array.from({ length: 12 }, () => Math.floor(Math.random() * 1000) + 500);
    
    const yearlyLabels = Array.from({ length: 5 }, (_, i) => `${2021 + i}`);
    const yearlyValues = Array.from({ length: 5 }, () => Math.floor(Math.random() * 10000) + 5000);
    
    setConsumptionData({
      hourly: { labels: hourlyLabels, values: hourlyValues },
      daily: { labels: dailyLabels, values: dailyValues },
      weekly: { labels: weeklyLabels, values: weeklyValues },
      monthly: { labels: monthlyLabels, values: monthlyValues },
      yearly: { labels: yearlyLabels, values: yearlyValues }
    });
    
    // Generate stats
    setStats({
      total_consumption: 12560,
      average_daily: 42,
      peak_usage: {
        value: 78,
        date: '2025-07-25',
        time: '08:30'
      },
      lowest_usage: {
        value: 22,
        date: '2025-07-19',
        time: '03:15'
      },
      change_percentage: -8.5,
      estimated_monthly: 1260,
      water_saved: 120,
      carbon_footprint: 3.2,
      peak_hours: ['07:00-09:00', '18:00-20:00'],
      efficiency_score: 85,
      anomalies_detected: 3,
      leakage_probability: 15
    });
    
    // Generate usage patterns (heatmap data)
    const patterns: UsagePattern[] = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        // Create a pattern where mornings and evenings have higher usage
        let baseValue = 10;
        
        // Morning peak (7-9 AM)
        if (hour >= 7 && hour <= 9) {
          baseValue = 60;
        }
        
        // Evening peak (6-8 PM)
        if (hour >= 18 && hour <= 20) {
          baseValue = 70;
        }
        
        // Night low (11 PM - 5 AM)
        if (hour >= 23 || hour <= 5) {
          baseValue = 5;
        }
        
        // Weekends have different patterns
        if (day === 0 || day === 6) {
          baseValue = baseValue * 1.2;
        }
        
        // Add some randomness
        const value = Math.floor(baseValue + (Math.random() * 20) - 10);
        
        patterns.push({
          day,
          hour,
          value: Math.max(0, value) // Ensure no negative values
        });
      }
    }
    setUsagePatterns(patterns);
    
    // Generate usage breakdown
    setUsageBreakdown([
      { category: 'Bathroom', percentage: 35, value: 4396, color: 'rgb(59, 130, 246)' }, // Blue
      { category: 'Kitchen', percentage: 30, value: 3768, color: 'rgb(16, 185, 129)' },  // Green
      { category: 'Laundry', percentage: 20, value: 2512, color: 'rgb(245, 158, 11)' },  // Yellow
      { category: 'Garden', percentage: 10, value: 1256, color: 'rgb(239, 68, 68)' },    // Red
      { category: 'Other', percentage: 5, value: 628, color: 'rgb(107, 114, 128)' }      // Gray
    ]);
    
    // Generate anomalies
    setAnomalies([
      {
        date: '2025-07-28',
        time: '08:15',
        value: 120,
        expected_value: 60,
        deviation_percentage: 100,
        type: 'Sudden Spike',
        description: 'Unusual high water usage detected',
        status: 'Investigating'
      },
      {
        date: '2025-07-25',
        time: '02:30',
        value: 25,
        expected_value: 5,
        deviation_percentage: 400,
        type: 'Night Usage',
        description: 'Unexpected water usage during night hours',
        status: 'Resolved'
      },
      {
        date: '2025-07-22',
        time: '14:45',
        value: 0,
        expected_value: 30,
        deviation_percentage: -100,
        type: 'No Flow',
        description: 'No water flow during expected usage hours',
        status: 'Resolved'
      }
    ]);
    
    // Generate comparison data
    setComparisonData([
      {
        category: 'Bathroom',
        current_period: 4396,
        previous_period: 4800,
        change_percentage: -8.4
      },
      {
        category: 'Kitchen',
        current_period: 3768,
        previous_period: 3600,
        change_percentage: 4.7
      },
      {
        category: 'Laundry',
        current_period: 2512,
        previous_period: 2700,
        change_percentage: -7.0
      },
      {
        category: 'Garden',
        current_period: 1256,
        previous_period: 1500,
        change_percentage: -16.3
      },
      {
        category: 'Other',
        current_period: 628,
        previous_period: 600,
        change_percentage: 4.7
      }
    ]);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getEfficiencyColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getLeakageProbabilityColor = (probability: number) => {
    if (probability <= 20) return 'text-green-600 dark:text-green-400';
    if (probability <= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <PageHeader 
        title="Water Consumption Analytics"
        description="Detailed analysis and insights into water consumption patterns"
        actions={
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => fetchAnalyticsData()}
              icon={<ArrowPathIcon className="h-5 w-5" />}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Export functionality would go here
                toast.info('Export functionality will be implemented in the future');
              }}
              icon={<CloudArrowDownIcon className="h-5 w-5" />}
              disabled={loading}
            >
              Export
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <FilterPanel
        customers={customers}
        properties={properties}
        meters={meters}
        selectedCustomer={selectedCustomer}
        selectedProperty={selectedProperty}
        selectedMeter={selectedMeter}
        dateRange={dateRange}
        onCustomerChange={setSelectedCustomer}
        onPropertyChange={setSelectedProperty}
        onMeterChange={setSelectedMeter}
        onDateRangeChange={setDateRange}
      />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : !selectedCustomer && !selectedProperty && !selectedMeter ? (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6 text-center">
            <BeakerIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No data selected</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Please select a customer, property, or meter to view consumption analytics.
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
                title="Efficiency Score"
                value={`${stats.efficiency_score}/100`}
                icon={<CheckCircleIcon className={`h-6 w-6 ${getEfficiencyColor(stats.efficiency_score)}`} />}
                footer={`Water Saved: ${stats.water_saved.toLocaleString()} L`}
              />
              <StatCard
                title="Leakage Probability"
                value={`${stats.leakage_probability}%`}
                icon={<ExclamationTriangleIcon className={`h-6 w-6 ${getLeakageProbabilityColor(stats.leakage_probability)}`} />}
                footer={`${stats.anomalies_detected} anomalies detected`}
              />
            </div>
          )}

          {/* Consumption Chart */}
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-2 sm:mb-0">
                  Water Consumption Trends
                </h3>
                <TimeRangeSelector
                  selectedRange={timeRange}
                  onChange={setTimeRange}
                />
              </div>
              <ConsumptionChart data={consumptionData} timeRange={timeRange} />
            </div>
          </div>

          {/* Usage Pattern and Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Usage Pattern Heatmap */}
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                  Usage Pattern by Day & Hour
                </h3>
                <UsagePatternHeatmap data={usagePatterns} />
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  <p>Peak usage hours: {stats?.peak_hours.join(', ')}</p>
                </div>
              </div>
            </div>

            {/* Usage Breakdown */}
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                  Usage Breakdown by Category
                </h3>
                <UsageBreakdownChart data={usageBreakdown} />
              </div>
            </div>
          </div>

          {/* Comparison Chart */}
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                Current vs Previous Period Comparison
              </h3>
              <ComparisonChart data={comparisonData} />
            </div>
          </div>

          {/* Anomaly Detection */}
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                Anomaly Detection
              </h3>
              {anomalies.length > 0 ? (
                <AnomalyTable anomalies={anomalies} />
              ) : (
                <div className="text-center py-6">
                  <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No anomalies detected</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Water consumption patterns appear normal for the selected period.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Insights and Recommendations */}
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                Insights & Recommendations
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <DocumentChartBarIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Usage Insights</h3>
                      <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Peak usage occurs between {stats?.peak_hours[0]} and {stats?.peak_hours[1]}</li>
                          <li>Bathroom usage accounts for {usageBreakdown[0]?.percentage}% of total consumption</li>
                          <li>Weekend usage is approximately 20% higher than weekdays</li>
                          <li>Overall water efficiency score is {stats?.efficiency_score}/100</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800 dark:text-green-300">Recommendations</h3>
                      <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Install water-efficient fixtures in bathrooms to reduce consumption</li>
                          <li>Consider implementing a rainwater harvesting system for garden irrigation</li>
                          <li>Schedule regular maintenance checks to prevent leaks</li>
                          <li>Implement a water recycling system for non-potable uses</li>
                          <li>Consider installing smart water monitoring devices for real-time alerts</li>
                        </ul>
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

export default ConsumptionAnalytics;