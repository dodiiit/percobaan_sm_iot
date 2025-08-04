import React from 'react';
import { useTranslation } from 'react-i18next';

const SuperadminDashboard: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t('superadmin.dashboard.title')}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">{t('superadmin.dashboard.totalClients')}</h3>
          <p className="text-3xl font-bold text-blue-600">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">{t('superadmin.dashboard.totalProperties')}</h3>
          <p className="text-3xl font-bold text-green-600">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">{t('superadmin.dashboard.totalCustomers')}</h3>
          <p className="text-3xl font-bold text-purple-600">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">{t('superadmin.dashboard.totalRevenue')}</h3>
          <p className="text-3xl font-bold text-yellow-600">$0</p>
        </div>
      </div>
    </div>
  );
};

export default SuperadminDashboard;