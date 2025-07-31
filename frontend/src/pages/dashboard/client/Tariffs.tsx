import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import TariffList from '../../../components/tariffs/TariffList';
import TariffDetail from '../../../components/tariffs/TariffDetail';

const Tariffs: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedTariffId, setSelectedTariffId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    // In a real application, you would get the client ID from the user context
    if (user && user.client_id) {
      setClientId(user.client_id);
    }
  }, [user]);

  const handleViewTariff = (id: string) => {
    setSelectedTariffId(id);
    setView('detail');
  };

  const handleFormCancel = () => {
    setView('list');
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Dummy functions for the TariffList component
  const handleAddTariff = () => {
    // Clients can't add tariffs
  };

  const handleEditTariff = () => {
    // Clients can't edit tariffs
  };

  return (
    <div>
      <div className="pb-5 border-b border-gray-200 dark:border-gray-700 sm:flex sm:items-center sm:justify-between">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
          {t('tariffs.management')}
        </h3>
      </div>

      <div className="mt-6">
        {view === 'list' && (
          <TariffList
            clientId={clientId}
            onEdit={handleEditTariff}
            onView={handleViewTariff}
            onAdd={handleAddTariff}
            onRefresh={handleRefresh}
            key={refreshKey}
            readOnly={true}
          />
        )}

        {view === 'detail' && selectedTariffId && (
          <TariffDetail
            tariffId={selectedTariffId}
            onClose={handleFormCancel}
          />
        )}
      </div>
    </div>
  );
};

export default Tariffs;