import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getServiceFeePlanWithComponents } from '../../services/serviceFeeService';
import { toast } from 'react-toastify';

interface ServiceFeePlanDetailProps {
  planId: string;
  onClose: () => void;
}

interface ServiceFeePlan {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  components: any[];
}

const ServiceFeePlanDetail: React.FC<ServiceFeePlanDetailProps> = ({ planId, onClose }) => {
  const { t } = useTranslation();
  const [plan, setPlan] = useState<ServiceFeePlan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const response = await getServiceFeePlanWithComponents(planId);
      setPlan(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch service fee plan details');
      toast.error(t('serviceFees.fetchDetailError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [planId]);

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
          onClick={fetchPlan}
          className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
          {t('serviceFees.planDetails')}
        </h3>
        <button
          onClick={onClose}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
        >
          {t('common.close')}
        </button>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-6">
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{plan.name}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {plan.description || t('serviceFees.noDescription')}
            </p>
          </div>
          <div className="sm:col-span-3">
            <div className="flex justify-end">
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  plan.is_active
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}
              >
                {plan.is_active ? t('common.active') : t('common.inactive')}
              </span>
            </div>
          </div>

          <div className="sm:col-span-6">
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">{t('serviceFees.components')}</h4>
            </div>
            {plan.components && plan.components.length > 0 ? (
              <div className="mt-2 flex flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div className="shadow overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {t('serviceFees.componentName')}
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {t('serviceFees.feeType')}
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {t('serviceFees.feeValue')}
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {t('common.status')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {plan.components.map((component) => (
                            <tr key={component.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {component.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {component.fee_type === 'percentage' ? t('serviceFees.percentage') : 
                                 component.fee_type === 'fixed' ? t('serviceFees.fixed') : 
                                 component.fee_type === 'tiered_percentage' ? t('serviceFees.tieredPercentage') : 
                                 t('serviceFees.tieredFixed')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {['tiered_percentage', 'tiered_fixed'].includes(component.fee_type) ? 
                                  t('serviceFees.tieredRates') : 
                                  `${component.fee_value}${component.fee_type === 'percentage' ? '%' : ''}`}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    component.is_active
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                  }`}
                                >
                                  {component.is_active ? t('common.active') : t('common.inactive')}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {t('serviceFees.noComponents')}
              </div>
            )}
          </div>

          {/* Component Details */}
          {plan.components && plan.components.length > 0 && plan.components.map((component) => (
            <div key={component.id} className="sm:col-span-6">
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">{component.name}</h4>
              </div>
              <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('serviceFees.feeType')}</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {component.fee_type === 'percentage' ? t('serviceFees.percentage') : 
                     component.fee_type === 'fixed' ? t('serviceFees.fixed') : 
                     component.fee_type === 'tiered_percentage' ? t('serviceFees.tieredPercentage') : 
                     t('serviceFees.tieredFixed')}
                  </dd>
                </div>
                {!['tiered_percentage', 'tiered_fixed'].includes(component.fee_type) && (
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('serviceFees.feeValue')}</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      {component.fee_value}{component.fee_type === 'percentage' ? '%' : ''}
                    </dd>
                  </div>
                )}
                {component.min_transaction_amount && (
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('serviceFees.minTransactionAmount')}</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{component.min_transaction_amount}</dd>
                  </div>
                )}
                {component.max_transaction_amount && (
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('serviceFees.maxTransactionAmount')}</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{component.max_transaction_amount}</dd>
                  </div>
                )}
                {component.min_fee_amount && (
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('serviceFees.minFeeAmount')}</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{component.min_fee_amount}</dd>
                  </div>
                )}
                {component.max_fee_amount && (
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('serviceFees.maxFeeAmount')}</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{component.max_fee_amount}</dd>
                  </div>
                )}
              </dl>

              {/* Fee Tiers */}
              {['tiered_percentage', 'tiered_fixed'].includes(component.fee_type) && component.tiers && component.tiers.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('serviceFees.feeTiers')}</h5>
                  <div className="mt-2 flex flex-col">
                    <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                      <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                        <div className="shadow overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  {t('serviceFees.amountRange')}
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  {t('serviceFees.feeValue')}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {component.tiers.map((tier) => (
                                <tr key={tier.id}>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                    {tier.min_amount} - {tier.max_amount ? tier.max_amount : t('serviceFees.unlimited')}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {tier.fee_value}{component.fee_type === 'tiered_percentage' ? '%' : ''}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Client Assignments */}
          {plan.client_assignments && plan.client_assignments.length > 0 && (
            <div className="sm:col-span-6">
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">{t('serviceFees.clientAssignments')}</h4>
              </div>
              <div className="mt-2 flex flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div className="shadow overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {t('serviceFees.client')}
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {t('serviceFees.effectiveFrom')}
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {t('serviceFees.effectiveTo')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {plan.client_assignments.map((assignment) => (
                            <tr key={assignment.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {assignment.client_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {new Date(assignment.effective_from).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {assignment.effective_to ? new Date(assignment.effective_to).toLocaleDateString() : t('serviceFees.indefinite')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceFeePlanDetail;