import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  UsersIcon,
  HomeIcon,
  CpuChipIcon,
  CreditCardIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BanknotesIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import api from '../../../services/api';
import Customers from './Customers';
import Meters from './Meters';
import Payments from './Payments';
import Properties from './Properties';
import Reports from './Reports';
import Settings from './Settings';
import ConsumptionAnalytics from './ConsumptionAnalytics';

// Dashboard Overview Component
const ClientOverview: React.FC = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalProperties: 0,
    totalMeters: 0,
    totalRevenue: 0,
    activeMeters: 0,
    offlineMeters: 0,
    lowCreditMeters: 0,
    pendingPayments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      // Fetch client-specific dashboard statistics
      const [customersRes, propertiesRes, metersRes, paymentsRes] = await Promise.all([
        api.get('/customers'),
        api.get('/properties'),
        api.get('/meters'),
        api.get('/payments')
      ]);

      setStats({
        totalCustomers: customersRes.data.data?.length || 0,
        totalProperties: propertiesRes.data.data?.length || 0,
        totalMeters: metersRes.data.data?.length || 0,
        totalRevenue: paymentsRes.data.data?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0,
        activeMeters: metersRes.data.data?.filter((m: any) => m.status === 'active').length || 0,
        offlineMeters: metersRes.data.data?.filter((m: any) => m.status === 'offline').length || 0,
        lowCreditMeters: metersRes.data.data?.filter((m: any) => m.credit_balance < 50000).length || 0,
        pendingPayments: paymentsRes.data.data?.filter((p: any) => p.status === 'pending').length || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Total Customers',
      value: stats.totalCustomers,
      icon: UsersIcon,
      color: 'bg-blue-500',
      change: '+5%',
      changeType: 'positive'
    },
    {
      name: 'Total Properties',
      value: stats.totalProperties,
      icon: HomeIcon,
      color: 'bg-green-500',
      change: '+3%',
      changeType: 'positive'
    },
    {
      name: 'Total Meters',
      value: stats.totalMeters,
      icon: CpuChipIcon,
      color: 'bg-purple-500',
      change: '+8%',
      changeType: 'positive'
    },
    {
      name: 'Monthly Revenue',
      value: `Rp ${stats.totalRevenue.toLocaleString()}`,
      icon: BanknotesIcon,
      color: 'bg-yellow-500',
      change: '+12%',
      changeType: 'positive'
    }
  ];

  const alertCards = [
    {
      name: 'Active Meters',
      value: stats.activeMeters,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      name: 'Offline Meters',
      value: stats.offlineMeters,
      icon: ExclamationTriangleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20'
    },
    {
      name: 'Low Credit Alerts',
      value: stats.lowCreditMeters,
      icon: ClockIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20'
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Client Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage your water authority operations
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
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {card.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {card.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
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
              Water Usage Trends
            </h3>
            <div className="mt-5 h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <ChartBarIcon className="h-16 w-16" />
              <span className="ml-2">Chart will be implemented with Chart.js</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Recent Activity
            </h3>
            <div className="mt-5">
              <div className="flow-root">
                <ul className="-mb-8">
                  <li>
                    <div className="relative pb-8">
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
                            <CreditCardIcon className="h-5 w-5 text-white" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Payment received from <span className="font-medium text-gray-900 dark:text-white">John Doe</span>
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                            1 hour ago
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="relative pb-8">
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
                            <CpuChipIcon className="h-5 w-5 text-white" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              New meter <span className="font-medium text-gray-900 dark:text-white">WM-001234</span> installed
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                            3 hours ago
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="relative">
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
                            <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Low credit alert for meter <span className="font-medium text-gray-900 dark:text-white">WM-001235</span>
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                            5 hours ago
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
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
            <button className="relative group bg-white dark:bg-gray-700 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500">
              <div>
                <span className="rounded-lg inline-flex p-3 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 ring-4 ring-white dark:ring-gray-700">
                  <UsersIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Add Customer
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Register a new customer to your system
                </p>
              </div>
            </button>

            <button className="relative group bg-white dark:bg-gray-700 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500">
              <div>
                <span className="rounded-lg inline-flex p-3 bg-green-50 dark:bg-green-900/50 text-green-700 dark:text-green-300 ring-4 ring-white dark:ring-gray-700">
                  <CpuChipIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Install Meter
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Add a new smart water meter
                </p>
              </div>
            </button>

            <button className="relative group bg-white dark:bg-gray-700 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500">
              <div>
                <span className="rounded-lg inline-flex p-3 bg-purple-50 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 ring-4 ring-white dark:ring-gray-700">
                  <ChartBarIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  View Reports
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Generate usage and revenue reports
                </p>
              </div>
            </button>

            <button className="relative group bg-white dark:bg-gray-700 p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500">
              <div>
                <span className="rounded-lg inline-flex p-3 bg-yellow-50 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 ring-4 ring-white dark:ring-gray-700">
                  <CreditCardIcon className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Process Payment
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Handle customer payments and top-ups
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};



const ClientDashboard: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<ClientOverview />} />
      <Route index element={<ClientOverview />} />
      <Route path="customers" element={<Customers />} />
      <Route path="meters" element={<Meters />} />
      <Route path="payments" element={<Payments />} />
      <Route path="properties" element={<Properties />} />
      <Route path="reports" element={<Reports />} />
      <Route path="settings" element={<Settings />} />
      <Route path="analytics" element={<ConsumptionAnalytics />} />
    </Routes>
  );
};

export default ClientDashboard;