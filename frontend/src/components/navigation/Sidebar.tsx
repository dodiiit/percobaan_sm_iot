import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HomeIcon,
  ChartBarIcon,
  UsersIcon,
  BuildingOfficeIcon,
  BeakerIcon,
  CreditCardIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  MapPinIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  ChartPieIcon,
  CalendarIcon,
  BellIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false, onToggleCollapse }) => {
  const { user } = useAuth();
  const location = useLocation();

  const getSidebarItems = () => {
    const baseItems = [
      {
        name: 'Dashboard',
        href: `/dashboard/${user?.role}`,
        icon: HomeIcon,
        current: location.pathname.includes('/dashboard')
      }
    ];

    switch (user?.role) {
      case 'superadmin':
        return [
          ...baseItems,
          {
            name: 'Analytics',
            href: '/dashboard/superadmin/analytics',
            icon: ChartBarIcon,
            current: location.pathname.includes('/analytics')
          },
          {
            name: 'Client Management',
            href: '/dashboard/superadmin/clients',
            icon: BuildingOfficeIcon,
            current: location.pathname.includes('/clients')
          },
          {
            name: 'User Management',
            href: '/dashboard/superadmin/users',
            icon: UsersIcon,
            current: location.pathname.includes('/users')
          },
          {
            name: 'System Monitoring',
            href: '/dashboard/superadmin/monitoring',
            icon: ExclamationTriangleIcon,
            current: location.pathname.includes('/monitoring')
          },
          {
            name: 'Revenue Reports',
            href: '/dashboard/superadmin/revenue',
            icon: BanknotesIcon,
            current: location.pathname.includes('/revenue')
          },
          {
            name: 'System Settings',
            href: '/dashboard/superadmin/settings',
            icon: Cog6ToothIcon,
            current: location.pathname.includes('/settings')
          }
        ];

      case 'client':
        return [
          ...baseItems,
          {
            name: 'Properties',
            href: '/dashboard/client/properties',
            icon: BuildingOfficeIcon,
            current: location.pathname.includes('/properties')
          },
          {
            name: 'Customers',
            href: '/dashboard/client/customers',
            icon: UserGroupIcon,
            current: location.pathname.includes('/customers')
          },
          {
            name: 'Water Meters',
            href: '/dashboard/client/meters',
            icon: BeakerIcon,
            current: location.pathname.includes('/meters')
          },
          {
            name: 'Billing & Payments',
            href: '/dashboard/client/billing',
            icon: CreditCardIcon,
            current: location.pathname.includes('/billing')
          },
          {
            name: 'Usage Analytics',
            href: '/dashboard/client/analytics',
            icon: ChartPieIcon,
            current: location.pathname.includes('/analytics')
          },
          {
            name: 'Reports',
            href: '/dashboard/client/reports',
            icon: DocumentTextIcon,
            current: location.pathname.includes('/reports')
          },
          {
            name: 'Maintenance',
            href: '/dashboard/client/maintenance',
            icon: WrenchScrewdriverIcon,
            current: location.pathname.includes('/maintenance')
          }
        ];

      case 'customer':
        return [
          ...baseItems,
          {
            name: 'Water Usage',
            href: '/dashboard/customer/usage',
            icon: ChartBarIcon,
            current: location.pathname.includes('/usage')
          },
          {
            name: 'My Meters',
            href: '/dashboard/customer/meters',
            icon: BeakerIcon,
            current: location.pathname.includes('/meters')
          },
          {
            name: 'Payment History',
            href: '/dashboard/customer/payments',
            icon: CreditCardIcon,
            current: location.pathname.includes('/payments')
          },
          {
            name: 'Bills & Invoices',
            href: '/dashboard/customer/bills',
            icon: DocumentTextIcon,
            current: location.pathname.includes('/bills')
          },
          {
            name: 'Top Up Balance',
            href: '/dashboard/customer/topup',
            icon: BanknotesIcon,
            current: location.pathname.includes('/topup')
          },
          {
            name: 'Usage Reports',
            href: '/dashboard/customer/reports',
            icon: ClipboardDocumentListIcon,
            current: location.pathname.includes('/reports')
          },
          {
            name: 'Notifications',
            href: '/dashboard/customer/notifications',
            icon: BellIcon,
            current: location.pathname.includes('/notifications')
          }
        ];

      default:
        return baseItems;
    }
  };

  const sidebarItems = getSidebarItems();

  const bottomItems = [
    {
      name: 'Settings',
      href: '/settings',
      icon: Cog6ToothIcon,
      current: location.pathname === '/settings'
    },
    {
      name: 'Help & Support',
      href: '/help',
      icon: QuestionMarkCircleIcon,
      current: location.pathname === '/help'
    }
  ];

  return (
    <div className={`bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } flex flex-col h-full`}>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <div className="flex items-center">
            <BeakerIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">
              IndoWater
            </span>
          </div>
        )}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-5 w-5" />
            ) : (
              <ChevronLeftIcon className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      {/* User Info */}
      {!isCollapsed && user && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user.role}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                item.current
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon
                className={`flex-shrink-0 h-5 w-5 ${
                  item.current
                    ? 'text-blue-500 dark:text-blue-400'
                    : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                } ${isCollapsed ? 'mx-auto' : 'mr-3'}`}
                aria-hidden="true"
              />
              {!isCollapsed && item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Items */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-2 space-y-1">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                item.current
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon
                className={`flex-shrink-0 h-5 w-5 ${
                  item.current
                    ? 'text-blue-500 dark:text-blue-400'
                    : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                } ${isCollapsed ? 'mx-auto' : 'mr-3'}`}
                aria-hidden="true"
              />
              {!isCollapsed && item.name}
            </Link>
          );
        })}
      </div>

      {/* Version Info */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            IndoWater v1.0.0
          </p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;