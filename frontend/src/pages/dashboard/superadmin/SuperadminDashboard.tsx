import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  UsersIcon,
  BuildingOfficeIcon,
  CpuChipIcon,
  CreditCardIcon,

  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import api from '../../../services/api';

// Dashboard Overview Component
const SuperadminOverview: React.FC = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalCustomers: 0,
    totalMeters: 0,
    totalPayments: 0,
    activeMeters: 0,
    offlineMeters: 0,
    pendingPayments: 0,
    monthlyRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      // Fetch dashboard statistics from API
      const [clientsRes, customersRes, metersRes, paymentsRes] = await Promise.all([
        api.get('/clients'),
        api.get('/customers'),
        api.get('/meters'),
        api.get('/payments')
      ]);

      setStats({
        totalClients: clientsRes.data.data?.length || 0,
        totalCustomers: customersRes.data.data?.length || 0,
        totalMeters: metersRes.data.data?.length || 0,
        totalPayments: paymentsRes.data.data?.length || 0,
        activeMeters: metersRes.data.data?.filter((m: any) => m.status === 'active').length || 0,
        offlineMeters: metersRes.data.data?.filter((m: any) => m.status === 'offline').length || 0,
        pendingPayments: paymentsRes.data.data?.filter((p: any) => p.status === 'pending').length || 0,
        monthlyRevenue: paymentsRes.data.data?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Total Clients',
      value: stats.totalClients,
      icon: BuildingOfficeIcon,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      name: 'Total Customers',
      value: stats.totalCustomers,
      icon: UsersIcon,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'positive'
    },
    {
      name: 'Total Meters',
      value: stats.totalMeters,
      icon: CpuChipIcon,
      color: 'bg-purple-500',
      change: '+15%',
      changeType: 'positive'
    },
    {
      name: 'Monthly Revenue',
      value: `Rp ${stats.monthlyRevenue.toLocaleString()}`,
      icon: CreditCardIcon,
      color: 'bg-yellow-500',
      change: '+23%',
      changeType: 'positive'
    }
  ];

  const alertCards = [
    {
      name: 'Active Meters',
      value: stats.activeMeters,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Offline Meters',
      value: stats.offlineMeters,
      icon: ExclamationTriangleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      name: 'Pending Payments',
      value: stats.pendingPayments,
      icon: ClockIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Superadmin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Overview of the entire IndoWater system
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
                          <CheckCircleIcon className="h-5 w-5 text-white" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            New client <span className="font-medium text-gray-900 dark:text-white">PT Water Jakarta</span> registered
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                          2 hours ago
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
                            <span className="font-medium text-gray-900 dark:text-white">50 new meters</span> installed in Jakarta area
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                          4 hours ago
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
                            <span className="font-medium text-gray-900 dark:text-white">3 meters</span> reported offline in Bandung
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                          6 hours ago
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
  );
};

const SuperadminDashboard: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<SuperadminOverview />} />
      <Route index element={<SuperadminOverview />} />
    </Routes>
  );
};

export default SuperadminDashboard;