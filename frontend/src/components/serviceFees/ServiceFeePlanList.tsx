import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PencilIcon, TrashIcon, PlusIcon, EyeIcon } from '@heroicons/react/24/outline';
import { getServiceFeePlans, deleteServiceFeePlan } from '../../services/serviceFeeService';
import { toast } from 'react-toastify';

interface ServiceFeePlanListProps {
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onAdd: () => void;
  onRefresh: () => void;
}

interface ServiceFeePlan {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const ServiceFeePlanList: React.FC<ServiceFeePlanListProps> = ({ onEdit, onView, onAdd, onRefresh }) => {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<ServiceFeePlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await getServiceFeePlans();
      setPlans(response.data.data.plans);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch service fee plans');
      toast.error(t('serviceFees.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm(t('serviceFees.confirmDelete'))) {
      try {
        await deleteServiceFeePlan(id);
        toast.success(t('serviceFees.deleteSuccess'));
        fetchPlans();
        onRefresh();
      } catch (err: any) {
        toast.error(err.response?.data?.message || t('serviceFees.deleteError'));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchPlans}
          className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
          {t('serviceFees.plansList')}
        </h3>
        <button
          onClick={onAdd}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-4 w-4 mr-1" />
          {t('serviceFees.addPlan')}
        </button>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700">
        {plans.length === 0 ? (
          <div className="px-4 py-5 sm:p-6 text-center text-gray-500 dark:text-gray-400">
            {t('serviceFees.emptyPlans')}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {plans.map((plan) => (
              <li key={plan.id}>
                <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                        {plan.name}
                      </p>
                      <span
                        className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          plan.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}
                      >
                        {plan.is_active ? t('common.active') : t('common.inactive')}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {plan.description || t('serviceFees.noDescription')}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t('common.created')}: {new Date(plan.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onView(plan.id)}
                      className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <EyeIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => onEdit(plan.id)}
                      className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <PencilIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <TrashIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ServiceFeePlanList;