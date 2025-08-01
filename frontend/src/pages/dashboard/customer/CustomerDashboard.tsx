import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import {
  CpuChipIcon,
  CreditCardIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BanknotesIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import api from '../../../services/api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Import other customer pages
import Topup from './Topup';
import Meters from './Meters';
import Consumption from './Consumption';
import Payments from './Payments';
import Profile from './Profile';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Water Usage Chart Component
const WaterUsageChart: React.FC = () => {
  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        
        // In a real app, this would fetch from the API
        // For now, we'll use mock data
        const mockData = {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          values: [120, 145, 132, 158, 142, 190, 210]
        };
        
        setChartData({
          labels: mockData.labels,
          datasets: [
            {
              label: 'Water Usage (Liters)',
              data: mockData.values,
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
        });
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <Line data={chartData} options={options} />;
};

// Dashboard Overview Component
const CustomerOverview: React.FC = () => {
  const [stats, setStats] = useState({
    totalMeters: 0,
    totalCredit: 0,
    monthlyUsage: 0,
    lastPayment: 0,
    activeMeters: 0,
    lowCreditMeters: 0,
    averageDailyUsage: 0
  });
  const [recentReadings, setRecentReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch customer-specific dashboard data
      const [metersRes, paymentsRes, readingsRes] = await Promise.all([
        api.get('/meters/my-meters'),
        api.get('/payments/my-payments'),
        api.get('/meters/my-readings')
      ]);

      const meters = metersRes.data.data || [];
      const payments = paymentsRes.data.data || [];
      const readings = readingsRes.data.data || [];

      setStats({
        totalMeters: meters.length,
        totalCredit: meters.reduce((sum: number, m: any) => sum + (m.credit_balance || 0), 0),
        monthlyUsage: readings.reduce((sum: number, r: any) => sum + (r.consumption || 0), 0),
        lastPayment: payments.length > 0 ? payments[0].amount : 0,
        activeMeters: meters.filter((m: any) => m.status === 'active').length,
        lowCreditMeters: meters.filter((m: any) => m.credit_balance < 50000).length,
        averageDailyUsage: readings.length > 0 ? readings.reduce((sum: number, r: any) => sum + (r.consumption || 0), 0) / readings.length : 0
      });

      setRecentReadings(readings.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Total Credit Balance',
      value: `Rp ${stats.totalCredit.toLocaleString()}`,
      icon: BanknotesIcon,
      color: 'bg-green-500',
      description: 'Available credit across all meters'
    },
    {
      name: 'Monthly Usage',
      value: `${stats.monthlyUsage.toFixed(1)} L`,
      icon: BeakerIcon,
      color: 'bg-blue-500',
      description: 'Water consumption this month'
    },
    {
      name: 'Active Meters',
      value: stats.activeMeters,
      icon: CpuChipIcon,
      color: 'bg-purple-500',
      description: 'Currently active water meters'
    },
    {
      name: 'Average Daily Usage',
      value: `${stats.averageDailyUsage.toFixed(1)} L`,
      icon: ChartBarIcon,
      color: 'bg-yellow-500',
      description: 'Daily water consumption average'
    }
  ];

  const alertCards = [
    {
      name: 'Active Meters',
      value: stats.activeMeters,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      description: 'Working properly'
    },
    {
      name: 'Low Credit Alerts',
      value: stats.lowCreditMeters,
      icon: ExclamationTriangleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      description: 'Need top-up soon'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Monitor your water usage and manage your account
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.name} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${card.color} p-3 rounded-md`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      {card.name}
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {card.value}
                    </dd>
                    <dd className="text-xs text-gray-500 dark:text-gray-400">
                      {card.description}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {alertCards.map((card) => (
          <div key={card.name} className={`${card.bgColor} overflow-hidden shadow rounded-lg`}>
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <card.icon className={`h-8 w-8 ${card.color}`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className={`text-sm font-medium ${card.color} truncate`}>
                      {card.name}
                    </dt>
                    <dd className={`text-3xl font-bold ${card.color}`}>
                      {card.value}
                    </dd>
                    <dd className={`text-xs ${card.color} opacity-75`}>
                      {card.description}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Chart */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Daily Water Usage
            </h3>
            <div className="mt-5 h-64">
              <WaterUsageChart />
            </div>
          </div>
        </div>

        {/* Recent Readings */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Recent Readings
            </h3>
            <div className="mt-5">
              <div className="flow-root">
                <ul className="-mb-8">
                  {recentReadings.length > 0 ? recentReadings.map((reading: any, index: number) => (
                    <li key={index}>
                      <div className={`relative ${index < recentReadings.length - 1 ? 'pb-8' : ''}`}>
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
                              <BeakerIcon className="h-5 w-5 text-white" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {reading.consumption || 0} L
                                </span> consumed
                              </p>
                              <p className="text-xs text-gray-400">
                                Meter: {reading.meter_id || 'Unknown'}
                              </p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                              {new Date(reading.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  )) : (
                    <li className="text-center text-gray-500 dark:text-gray-400 py-4">
                      No recent readings available
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Quick Actions
          </h3>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/dashboard/customer/topup"
              className="relative group bg-white dark:bg-gray-700 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300 ring-4 ring-white dark:ring-gray-700">
                  <CreditCardIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Top Up Credit
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Add credit to your water meters
                </p>
              </div>
            </Link>

            <Link
              to="/dashboard/customer/meters"
              className="relative group bg-white dark:bg-gray-700 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 ring-4 ring-white dark:ring-gray-700">
                  <CpuChipIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  View Meters
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Check your water meter status
                </p>
              </div>
            </Link>

            <Link
              to="/dashboard/customer/consumption"
              className="relative group bg-white dark:bg-gray-700 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-purple-50 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 ring-4 ring-white dark:ring-gray-700">
                  <ChartBarIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Usage History
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  View your water consumption history
                </p>
              </div>
            </Link>

            <Link
              to="/dashboard/customer/payments"
              className="relative group bg-white dark:bg-gray-700 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-yellow-50 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 ring-4 ring-white dark:ring-gray-700">
                  <BanknotesIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Payment History
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  View your payment transactions
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Low Credit Warning */}
      {stats.lowCreditMeters > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                <strong>Low Credit Warning:</strong> You have {stats.lowCreditMeters} meter(s) with low credit balance. 
                <Link to="/dashboard/customer/topup" className="font-medium underline hover:text-yellow-600 dark:hover:text-yellow-200 ml-1">
                  Top up now
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CustomerDashboard: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<CustomerOverview />} />
      <Route index element={<CustomerOverview />} />
      <Route path="topup" element={<Topup />} />
      <Route path="meters" element={<Meters />} />
      <Route path="consumption" element={<Consumption />} />
      <Route path="payments" element={<Payments />} />
      <Route path="profile" element={<Profile />} />
    </Routes>
  );
};

export default CustomerDashboard;