import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getCompleteTariff, calculatePrice } from '../../services/tariffService';
import { toast } from 'react-toastify';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

interface TariffDetailProps {
  tariffId: string;
  onClose: () => void;
}

interface Tariff {
  id: string;
  name: string;
  description: string;
  base_price: number;
  price_unit: string;
  min_charge: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  seasonal_rates: any[];
  bulk_discount_tiers: any[];
  dynamic_discount_rules: any[];
}

interface PriceCalculationValues {
  volume: number;
  date: string;
  customer_type?: string;
}

const TariffDetail: React.FC<TariffDetailProps> = ({ tariffId, onClose }) => {
  const { t } = useTranslation();
  const [tariff, setTariff] = useState<Tariff | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [calculatedPrice, setCalculatedPrice] = useState<any>(null);
  const [calculating, setCalculating] = useState<boolean>(false);

  const fetchTariff = async () => {
    try {
      setLoading(true);
      const response = await getCompleteTariff(tariffId);
      setTariff(response.data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch tariff details');
      toast.error(t('tariffs.fetchDetailError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTariff();
  }, [tariffId]);

  const validationSchema = Yup.object({
    volume: Yup.number()
      .required(t('validation.required'))
      .min(0, t('validation.minValue', { value: 0 })),
    date: Yup.date().required(t('validation.required')),
  });

  const handleCalculatePrice = async (values: PriceCalculationValues) => {
    try {
      setCalculating(true);
      const response = await calculatePrice(tariffId, values);
      setCalculatedPrice(response.data.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('tariffs.calculateError'));
    } finally {
      setCalculating(false);
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
          onClick={fetchTariff}
          className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  if (!tariff) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
          {t('tariffs.details')}
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
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{tariff.name}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {tariff.description || t('tariffs.noDescription')}
            </p>
          </div>
          <div className="sm:col-span-3">
            <div className="flex justify-end">
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  tariff.is_active
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                }`}
              >
                {tariff.is_active ? t('common.active') : t('common.inactive')}
              </span>
            </div>
          </div>

          <div className="sm:col-span-6">
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">{t('tariffs.basicInfo')}</h4>
            </div>
            <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('tariffs.basePrice')}</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {tariff.base_price} {tariff.price_unit === 'per_cubic_meter' ? t('tariffs.perCubicMeter') : 
                    tariff.price_unit === 'per_gallon' ? t('tariffs.perGallon') : 
                    tariff.price_unit === 'per_liter' ? t('tariffs.perLiter') : 
                    t('tariffs.flatRate')}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('tariffs.minCharge')}</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {tariff.min_charge > 0 ? tariff.min_charge : t('tariffs.none')}
                </dd>
              </div>
            </dl>
          </div>

          {/* Seasonal Rates */}
          {tariff.seasonal_rates && tariff.seasonal_rates.length > 0 && (
            <div className="sm:col-span-6">
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">{t('tariffs.seasonalRates')}</h4>
              </div>
              <div className="mt-2 flex flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div className="shadow overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {t('tariffs.seasonName')}
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {t('tariffs.period')}
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {t('tariffs.adjustment')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {tariff.seasonal_rates.map((rate) => (
                            <tr key={rate.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {rate.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {new Date(rate.start_date).toLocaleDateString()} - {new Date(rate.end_date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {rate.price_adjustment} {rate.adjustment_type === 'percentage' ? '%' : ''}
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

          {/* Bulk Discount Tiers */}
          {tariff.bulk_discount_tiers && tariff.bulk_discount_tiers.length > 0 && (
            <div className="sm:col-span-6">
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">{t('tariffs.bulkDiscounts')}</h4>
              </div>
              <div className="mt-2 flex flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div className="shadow overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {t('tariffs.volumeRange')}
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {t('tariffs.discount')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {tariff.bulk_discount_tiers.map((tier) => (
                            <tr key={tier.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {tier.min_volume} - {tier.max_volume ? tier.max_volume : t('tariffs.unlimited')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {tier.discount_value} {tier.discount_type === 'percentage' ? '%' : ''}
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

          {/* Dynamic Discount Rules */}
          {tariff.dynamic_discount_rules && tariff.dynamic_discount_rules.length > 0 && (
            <div className="sm:col-span-6">
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-md font-medium text-gray-900 dark:text-white">{t('tariffs.dynamicDiscounts')}</h4>
              </div>
              <div className="mt-2 flex flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div className="shadow overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {t('tariffs.ruleName')}
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {t('tariffs.condition')}
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {t('tariffs.discount')}
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {t('common.status')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {tariff.dynamic_discount_rules.map((rule) => (
                            <tr key={rule.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {rule.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {rule.condition_type === 'time_based' ? t('tariffs.timeBased') : 
                                 rule.condition_type === 'volume_based' ? t('tariffs.volumeBased') : 
                                 t('tariffs.customerBased')}: {rule.condition_value}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {rule.discount_value} {rule.discount_type === 'percentage' ? '%' : ''}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    rule.is_active
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                  }`}
                                >
                                  {rule.is_active ? t('common.active') : t('common.inactive')}
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
            </div>
          )}

          {/* Price Calculator */}
          <div className="sm:col-span-6">
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">{t('tariffs.priceCalculator')}</h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('tariffs.priceCalculatorDescription')}
              </p>
            </div>
            <div className="mt-4">
              <Formik
                initialValues={{
                  volume: 0,
                  date: new Date().toISOString().split('T')[0],
                  customer_type: '',
                }}
                validationSchema={validationSchema}
                onSubmit={handleCalculatePrice}
              >
                <Form className="space-y-4">
                  <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-3">
                    <div>
                      <label htmlFor="volume" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('tariffs.volume')} *
                      </label>
                      <div className="mt-1">
                        <Field
                          type="number"
                          name="volume"
                          id="volume"
                          min="0"
                          step="0.01"
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                        />
                        <ErrorMessage name="volume" component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('tariffs.date')} *
                      </label>
                      <div className="mt-1">
                        <Field
                          type="date"
                          name="date"
                          id="date"
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                        />
                        <ErrorMessage name="date" component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                      </div>
                    </div>
                    {tariff.dynamic_discount_rules && tariff.dynamic_discount_rules.some(rule => rule.condition_type === 'customer_based') && (
                      <div>
                        <label htmlFor="customer_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          {t('tariffs.customerType')}
                        </label>
                        <div className="mt-1">
                          <Field
                            as="select"
                            name="customer_type"
                            id="customer_type"
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                          >
                            <option value="">{t('tariffs.selectCustomerType')}</option>
                            <option value="residential">{t('tariffs.residential')}</option>
                            <option value="commercial">{t('tariffs.commercial')}</option>
                            <option value="industrial">{t('tariffs.industrial')}</option>
                          </Field>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <button
                      type="submit"
                      disabled={calculating}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {calculating ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t('tariffs.calculating')}
                        </span>
                      ) : (
                        t('tariffs.calculate')
                      )}
                    </button>
                  </div>
                </Form>
              </Formik>
            </div>

            {calculatedPrice && (
              <div className="mt-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                <h5 className="text-md font-medium text-gray-900 dark:text-white">{t('tariffs.calculationResults')}</h5>
                <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('tariffs.baseAmount')}</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{calculatedPrice.base_amount}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('tariffs.seasonalAdjustment')}</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{calculatedPrice.seasonal_adjustment || 0}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('tariffs.bulkDiscount')}</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{calculatedPrice.bulk_discount || 0}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('tariffs.dynamicDiscount')}</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{calculatedPrice.dynamic_discount || 0}</dd>
                  </div>
                  <div className="sm:col-span-2 border-t border-gray-200 dark:border-gray-600 pt-2">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('tariffs.finalPrice')}</dt>
                    <dd className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{calculatedPrice.final_price}</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TariffDetail;