import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  UsersIcon,
  BuildingOfficeIcon,
  CpuChipIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { dashboardAPI } from '../../../services/api';
import PageHeader from '../../../components/common/PageHeader';
import Button from '../../../components/ui/Button';
import ClientsManagement from './ClientsManagement';
import CustomersManagement from './CustomersManagement';
import MetersManagement from './MetersManagement';
import PaymentsManagement from './PaymentsManagement';
import PropertiesManagement from './PropertiesManagement';
import ReportsManagement from './ReportsManagement';
import SystemSettings from './SystemSettings';
import TariffsManagement from './TariffsManagement';

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
    monthlyRevenue: 0,
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch dashboard data from the API
      const response = await dashboardAPI.getSuperadminDashboard();
      
      if (response.data && response.data.status === 'success') {
        const dashboardData = response.data.data;
        
        setStats({
          totalClients: dashboardData.clients.total || 0,
          totalCustomers: dashboardData.customers.total || 0,
          totalMeters: dashboardData.meters.total || 0,
          totalPayments: dashboardData.payments.total || 0,
          activeMeters: dashboardData.meters.active || 0,
          offlineMeters: dashboardData.meters.offline || 0,
          pendingPayments: dashboardData.payments.pending || 0,
          monthlyRevenue: dashboardData.revenue.monthly || 0,
          recentActivities: dashboardData.recent_activities || []
        });
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError('Failed to load dashboard data. Please try again later.');
      
      // Set fallback data for development/testing
      setStats({
        totalClients: 15,
        totalCustomers: 245,
        totalMeters: 320,
        totalPayments: 1250,
        activeMeters: 305,
        offlineMeters: 15,
        pendingPayments: 28,
        monthlyRevenue: 45000000,
        recentActivities: []
      });
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
      <PageHeader
        title="Superadmin Dashboard"
        description="Overview of the entire IndoWater system"
        actions={
          <div className="flex space-x-3">
            <Button variant="outline" size="sm">
              Export Report
            </Button>
            <Button size="sm">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>
        }
      />

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
              {error && (
                <div className="text-red-500 mb-4 p-3 bg-red-50 rounded-md">
                  {error}
                </div>
              )}
              
              <ul className="-mb-8">
                {stats.recentActivities && stats.recentActivities.length > 0 ? (
                  stats.recentActivities.map((activity: any, index: number) => {
                    // Determine icon and color based on activity type
                    let Icon = CheckCircleIcon;
                    let bgColor = 'bg-green-500';
                    
                    if (activity.type === 'client_registered') {
                      Icon = BuildingOfficeIcon;
                      bgColor = 'bg-green-500';
                    } else if (activity.type === 'meter_installed') {
                      Icon = CpuChipIcon;
                      bgColor = 'bg-blue-500';
                    } else if (activity.type === 'meter_offline') {
                      Icon = ExclamationTriangleIcon;
                      bgColor = 'bg-yellow-500';
                    } else if (activity.type === 'payment_received') {
                      Icon = CreditCardIcon;
                      bgColor = 'bg-purple-500';
                    } else if (activity.type === 'customer_registered') {
                      Icon = UsersIcon;
                      bgColor = 'bg-indigo-500';
                    }
                    
                    return (
                      <li key={index}>
                        <div className={`relative ${index < stats.recentActivities.length - 1 ? 'pb-8' : ''}`}>
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full ${bgColor} flex items-center justify-center ring-8 ring-white dark:ring-gray-800`}>
                                <Icon className="h-5 w-5 text-white" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {activity.message && (
                                    <span dangerouslySetInnerHTML={{ __html: activity.message }} />
                                  )}
                                </p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                                {activity.time_ago || 'Just now'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })
                ) : (
                  // Fallback data if no activities are available
                  <>
                    <li>
                      <div className="relative pb-8">
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
                              <BuildingOfficeIcon className="h-5 w-5 text-white" />
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
                  </>
                )}
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
      <Route path="clients" element={<ClientsManagement />} />
      <Route path="customers" element={<CustomersManagement />} />
      <Route path="meters" element={<MetersManagement />} />
      <Route path="payments" element={<PaymentsManagement />} />
      <Route path="properties" element={<PropertiesManagement />} />
      <Route path="reports" element={<ReportsManagement />} />
      <Route path="settings" element={<SystemSettings />} />
      <Route path="tariffs" element={<TariffsManagement />} />
    </Routes>
  );
};

export default SuperadminDashboard;