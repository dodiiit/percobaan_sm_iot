import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import TariffList from '../../../components/tariffs/TariffList';
import TariffForm from '../../../components/tariffs/TariffForm';
import TariffDetail from '../../../components/tariffs/TariffDetail';

const TariffsManagement: React.FC = () => {
  const { t } = useTranslation();
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'detail'>('list');
  const [selectedTariffId, setSelectedTariffId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    // In a real application, you would get the client ID from the user context or URL params
    // For now, we'll use a dummy client ID
    setClientId('client-123');
  }, []);

  const handleAddTariff = () => {
    setSelectedTariffId(null);
    setView('create');
  };

  const handleEditTariff = (id: string) => {
    setSelectedTariffId(id);
    setView('edit');
  };

  const handleViewTariff = (id: string) => {
    setSelectedTariffId(id);
    setView('detail');
  };

  const handleFormSuccess = () => {
    setView('list');
    setRefreshKey(prev => prev + 1);
  };

  const handleFormCancel = () => {
    setView('list');
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
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
          />
        )}

        {(view === 'create' || view === 'edit') && (
          <TariffForm
            clientId={clientId}
            tariffId={view === 'edit' ? selectedTariffId! : undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
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

export default TariffsManagement;