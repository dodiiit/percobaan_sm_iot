import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { createTariff, updateTariff, getTariff } from '../../services/tariffService';

interface TariffFormProps {
  clientId: string;
  tariffId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface TariffFormValues {
  name: string;
  description: string;
  base_price: number;
  price_unit: string;
  min_charge: number;
  is_active: boolean;
  has_seasonal_rates: boolean;
  has_bulk_discounts: boolean;
  has_dynamic_discounts: boolean;
  seasonal_rates: {
    name: string;
    start_date: string;
    end_date: string;
    price_adjustment: number;
    adjustment_type: 'percentage' | 'fixed';
  }[];
  bulk_discount_tiers: {
    min_volume: number;
    max_volume: number | null;
    discount_value: number;
    discount_type: 'percentage' | 'fixed';
  }[];
  dynamic_discount_rules: {
    name: string;
    condition_type: 'time_based' | 'volume_based' | 'customer_based';
    condition_value: string;
    discount_value: number;
    discount_type: 'percentage' | 'fixed';
    is_active: boolean;
  }[];
}

const initialValues: TariffFormValues = {
  name: '',
  description: '',
  base_price: 0,
  price_unit: 'per_cubic_meter',
  min_charge: 0,
  is_active: true,
  has_seasonal_rates: false,
  has_bulk_discounts: false,
  has_dynamic_discounts: false,
  seasonal_rates: [],
  bulk_discount_tiers: [],
  dynamic_discount_rules: [],
};

const TariffForm: React.FC<TariffFormProps> = ({ clientId, tariffId, onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(false);
  const [initialFormValues, setInitialFormValues] = useState<TariffFormValues>(initialValues);
  const [isEditMode, setIsEditMode] = useState<boolean>(!!tariffId);

  const validationSchema = Yup.object({
    name: Yup.string().required(t('validation.required')),
    base_price: Yup.number()
      .required(t('validation.required'))
      .min(0, t('validation.minValue', { value: 0 })),
    price_unit: Yup.string().required(t('validation.required')),
    min_charge: Yup.number().min(0, t('validation.minValue', { value: 0 })),
    seasonal_rates: Yup.array().of(
      Yup.object({
        name: Yup.string().required(t('validation.required')),
        start_date: Yup.date().required(t('validation.required')),
        end_date: Yup.date().required(t('validation.required')),
        price_adjustment: Yup.number().required(t('validation.required')),
        adjustment_type: Yup.string().required(t('validation.required')),
      })
    ),
    bulk_discount_tiers: Yup.array().of(
      Yup.object({
        min_volume: Yup.number()
          .required(t('validation.required'))
          .min(0, t('validation.minValue', { value: 0 })),
        max_volume: Yup.number()
          .nullable()
          .min(0, t('validation.minValue', { value: 0 })),
        discount_value: Yup.number()
          .required(t('validation.required'))
          .min(0, t('validation.minValue', { value: 0 })),
        discount_type: Yup.string().required(t('validation.required')),
      })
    ),
    dynamic_discount_rules: Yup.array().of(
      Yup.object({
        name: Yup.string().required(t('validation.required')),
        condition_type: Yup.string().required(t('validation.required')),
        condition_value: Yup.string().required(t('validation.required')),
        discount_value: Yup.number()
          .required(t('validation.required'))
          .min(0, t('validation.minValue', { value: 0 })),
        discount_type: Yup.string().required(t('validation.required')),
      })
    ),
  });

  useEffect(() => {
    const fetchTariff = async () => {
      if (tariffId) {
        try {
          setLoading(true);
          const response = await getTariff(tariffId);
          const tariff = response.data.data;
          
          // Transform API data to form values
          const formValues: TariffFormValues = {
            name: tariff.name,
            description: tariff.description || '',
            base_price: tariff.base_price,
            price_unit: tariff.price_unit,
            min_charge: tariff.min_charge || 0,
            is_active: tariff.is_active,
            has_seasonal_rates: tariff.seasonal_rates && tariff.seasonal_rates.length > 0,
            has_bulk_discounts: tariff.bulk_discount_tiers && tariff.bulk_discount_tiers.length > 0,
            has_dynamic_discounts: tariff.dynamic_discount_rules && tariff.dynamic_discount_rules.length > 0,
            seasonal_rates: tariff.seasonal_rates || [],
            bulk_discount_tiers: tariff.bulk_discount_tiers || [],
            dynamic_discount_rules: tariff.dynamic_discount_rules || [],
          };
          
          setInitialFormValues(formValues);
        } catch (err: any) {
          toast.error(err.response?.data?.message || t('tariffs.fetchError'));
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTariff();
  }, [tariffId, t]);

  const handleSubmit = async (values: TariffFormValues) => {
    try {
      setLoading(true);
      
      // Prepare data for API
      const tariffData = {
        client_id: clientId,
        name: values.name,
        description: values.description,
        base_price: values.base_price,
        price_unit: values.price_unit,
        min_charge: values.min_charge,
        is_active: values.is_active,
        seasonal_rates: values.has_seasonal_rates ? values.seasonal_rates : [],
        bulk_discount_tiers: values.has_bulk_discounts ? values.bulk_discount_tiers : [],
        dynamic_discount_rules: values.has_dynamic_discounts ? values.dynamic_discount_rules : [],
      };
      
      if (isEditMode) {
        await updateTariff(tariffId!, tariffData);
        toast.success(t('tariffs.updateSuccess'));
      } else {
        await createTariff(tariffData);
        toast.success(t('tariffs.createSuccess'));
      }
      
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('tariffs.saveError'));
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
          {isEditMode ? t('tariffs.edit') : t('tariffs.create')}
        </h3>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-6">
        <Formik
          initialValues={initialFormValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, setFieldValue, errors, touched }) => (
            <Form className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                {/* Basic Information */}
                <div className="sm:col-span-3">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('tariffs.name')} *
                  </label>
                  <div className="mt-1">
                    <Field
                      type="text"
                      name="name"
                      id="name"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    />
                    <ErrorMessage name="name" component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="is_active" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('tariffs.status')}
                  </label>
                  <div className="mt-1">
                    <Field
                      as="select"
                      name="is_active"
                      id="is_active"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    >
                      <option value="true">{t('common.active')}</option>
                      <option value="false">{t('common.inactive')}</option>
                    </Field>
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('tariffs.description')}
                  </label>
                  <div className="mt-1">
                    <Field
                      as="textarea"
                      name="description"
                      id="description"
                      rows={3}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="base_price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('tariffs.basePrice')} *
                  </label>
                  <div className="mt-1">
                    <Field
                      type="number"
                      name="base_price"
                      id="base_price"
                      min="0"
                      step="0.01"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    />
                    <ErrorMessage name="base_price" component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="price_unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('tariffs.priceUnit')} *
                  </label>
                  <div className="mt-1">
                    <Field
                      as="select"
                      name="price_unit"
                      id="price_unit"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    >
                      <option value="per_cubic_meter">{t('tariffs.perCubicMeter')}</option>
                      <option value="per_gallon">{t('tariffs.perGallon')}</option>
                      <option value="per_liter">{t('tariffs.perLiter')}</option>
                      <option value="flat_rate">{t('tariffs.flatRate')}</option>
                    </Field>
                    <ErrorMessage name="price_unit" component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="min_charge" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('tariffs.minCharge')}
                  </label>
                  <div className="mt-1">
                    <Field
                      type="number"
                      name="min_charge"
                      id="min_charge"
                      min="0"
                      step="0.01"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                    />
                    <ErrorMessage name="min_charge" component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                  </div>
                </div>

                {/* Feature Toggles */}
                <div className="sm:col-span-6">
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('tariffs.features')}</h3>
                  </div>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <Field
                          type="checkbox"
                          name="has_seasonal_rates"
                          id="has_seasonal_rates"
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="has_seasonal_rates" className="font-medium text-gray-700 dark:text-gray-300">
                          {t('tariffs.hasSeasonalRates')}
                        </label>
                        <p className="text-gray-500 dark:text-gray-400">{t('tariffs.seasonalRatesDescription')}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <Field
                          type="checkbox"
                          name="has_bulk_discounts"
                          id="has_bulk_discounts"
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="has_bulk_discounts" className="font-medium text-gray-700 dark:text-gray-300">
                          {t('tariffs.hasBulkDiscounts')}
                        </label>
                        <p className="text-gray-500 dark:text-gray-400">{t('tariffs.bulkDiscountsDescription')}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <Field
                          type="checkbox"
                          name="has_dynamic_discounts"
                          id="has_dynamic_discounts"
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="has_dynamic_discounts" className="font-medium text-gray-700 dark:text-gray-300">
                          {t('tariffs.hasDynamicDiscounts')}
                        </label>
                        <p className="text-gray-500 dark:text-gray-400">{t('tariffs.dynamicDiscountsDescription')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seasonal Rates */}
                {values.has_seasonal_rates && (
                  <div className="sm:col-span-6">
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('tariffs.seasonalRates')}</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {t('tariffs.seasonalRatesInfo')}
                      </p>
                    </div>
                    <FieldArray name="seasonal_rates">
                      {({ push, remove }) => (
                        <div className="mt-4">
                          {values.seasonal_rates.map((_, index) => (
                            <div key={index} className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                              <div className="sm:col-span-2">
                                <label htmlFor={`seasonal_rates.${index}.name`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {t('tariffs.seasonName')} *
                                </label>
                                <div className="mt-1">
                                  <Field
                                    type="text"
                                    name={`seasonal_rates.${index}.name`}
                                    id={`seasonal_rates.${index}.name`}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                  />
                                  <ErrorMessage name={`seasonal_rates.${index}.name`} component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                                </div>
                              </div>

                              <div className="sm:col-span-2">
                                <label htmlFor={`seasonal_rates.${index}.start_date`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {t('tariffs.startDate')} *
                                </label>
                                <div className="mt-1">
                                  <Field
                                    type="date"
                                    name={`seasonal_rates.${index}.start_date`}
                                    id={`seasonal_rates.${index}.start_date`}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                  />
                                  <ErrorMessage name={`seasonal_rates.${index}.start_date`} component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                                </div>
                              </div>

                              <div className="sm:col-span-2">
                                <label htmlFor={`seasonal_rates.${index}.end_date`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {t('tariffs.endDate')} *
                                </label>
                                <div className="mt-1">
                                  <Field
                                    type="date"
                                    name={`seasonal_rates.${index}.end_date`}
                                    id={`seasonal_rates.${index}.end_date`}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                  />
                                  <ErrorMessage name={`seasonal_rates.${index}.end_date`} component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                                </div>
                              </div>

                              <div className="sm:col-span-2">
                                <label htmlFor={`seasonal_rates.${index}.price_adjustment`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {t('tariffs.priceAdjustment')} *
                                </label>
                                <div className="mt-1">
                                  <Field
                                    type="number"
                                    name={`seasonal_rates.${index}.price_adjustment`}
                                    id={`seasonal_rates.${index}.price_adjustment`}
                                    step="0.01"
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                  />
                                  <ErrorMessage name={`seasonal_rates.${index}.price_adjustment`} component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                                </div>
                              </div>

                              <div className="sm:col-span-2">
                                <label htmlFor={`seasonal_rates.${index}.adjustment_type`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {t('tariffs.adjustmentType')} *
                                </label>
                                <div className="mt-1">
                                  <Field
                                    as="select"
                                    name={`seasonal_rates.${index}.adjustment_type`}
                                    id={`seasonal_rates.${index}.adjustment_type`}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                  >
                                    <option value="percentage">{t('tariffs.percentage')}</option>
                                    <option value="fixed">{t('tariffs.fixed')}</option>
                                  </Field>
                                  <ErrorMessage name={`seasonal_rates.${index}.adjustment_type`} component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                                </div>
                              </div>

                              <div className="sm:col-span-2 flex items-end">
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                                >
                                  <MinusIcon className="h-4 w-4 mr-1" />
                                  {t('common.remove')}
                                </button>
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => push({
                              name: '',
                              start_date: '',
                              end_date: '',
                              price_adjustment: 0,
                              adjustment_type: 'percentage',
                            })}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                          >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            {t('tariffs.addSeasonalRate')}
                          </button>
                        </div>
                      )}
                    </FieldArray>
                  </div>
                )}

                {/* Bulk Discount Tiers */}
                {values.has_bulk_discounts && (
                  <div className="sm:col-span-6">
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('tariffs.bulkDiscounts')}</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {t('tariffs.bulkDiscountsInfo')}
                      </p>
                    </div>
                    <FieldArray name="bulk_discount_tiers">
                      {({ push, remove }) => (
                        <div className="mt-4">
                          {values.bulk_discount_tiers.map((_, index) => (
                            <div key={index} className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                              <div className="sm:col-span-2">
                                <label htmlFor={`bulk_discount_tiers.${index}.min_volume`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {t('tariffs.minVolume')} *
                                </label>
                                <div className="mt-1">
                                  <Field
                                    type="number"
                                    name={`bulk_discount_tiers.${index}.min_volume`}
                                    id={`bulk_discount_tiers.${index}.min_volume`}
                                    min="0"
                                    step="0.01"
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                  />
                                  <ErrorMessage name={`bulk_discount_tiers.${index}.min_volume`} component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                                </div>
                              </div>

                              <div className="sm:col-span-2">
                                <label htmlFor={`bulk_discount_tiers.${index}.max_volume`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {t('tariffs.maxVolume')}
                                </label>
                                <div className="mt-1">
                                  <Field
                                    type="number"
                                    name={`bulk_discount_tiers.${index}.max_volume`}
                                    id={`bulk_discount_tiers.${index}.max_volume`}
                                    min="0"
                                    step="0.01"
                                    placeholder={t('tariffs.noLimit')}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                  />
                                  <ErrorMessage name={`bulk_discount_tiers.${index}.max_volume`} component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                                </div>
                              </div>

                              <div className="sm:col-span-2">
                                <label htmlFor={`bulk_discount_tiers.${index}.discount_value`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {t('tariffs.discountValue')} *
                                </label>
                                <div className="mt-1">
                                  <Field
                                    type="number"
                                    name={`bulk_discount_tiers.${index}.discount_value`}
                                    id={`bulk_discount_tiers.${index}.discount_value`}
                                    min="0"
                                    step="0.01"
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                  />
                                  <ErrorMessage name={`bulk_discount_tiers.${index}.discount_value`} component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                                </div>
                              </div>

                              <div className="sm:col-span-2">
                                <label htmlFor={`bulk_discount_tiers.${index}.discount_type`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {t('tariffs.discountType')} *
                                </label>
                                <div className="mt-1">
                                  <Field
                                    as="select"
                                    name={`bulk_discount_tiers.${index}.discount_type`}
                                    id={`bulk_discount_tiers.${index}.discount_type`}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                  >
                                    <option value="percentage">{t('tariffs.percentage')}</option>
                                    <option value="fixed">{t('tariffs.fixed')}</option>
                                  </Field>
                                  <ErrorMessage name={`bulk_discount_tiers.${index}.discount_type`} component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                                </div>
                              </div>

                              <div className="sm:col-span-2 flex items-end">
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                                >
                                  <MinusIcon className="h-4 w-4 mr-1" />
                                  {t('common.remove')}
                                </button>
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => push({
                              min_volume: 0,
                              max_volume: null,
                              discount_value: 0,
                              discount_type: 'percentage',
                            })}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                          >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            {t('tariffs.addBulkDiscount')}
                          </button>
                        </div>
                      )}
                    </FieldArray>
                  </div>
                )}

                {/* Dynamic Discount Rules */}
                {values.has_dynamic_discounts && (
                  <div className="sm:col-span-6">
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('tariffs.dynamicDiscounts')}</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {t('tariffs.dynamicDiscountsInfo')}
                      </p>
                    </div>
                    <FieldArray name="dynamic_discount_rules">
                      {({ push, remove }) => (
                        <div className="mt-4">
                          {values.dynamic_discount_rules.map((_, index) => (
                            <div key={index} className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                              <div className="sm:col-span-2">
                                <label htmlFor={`dynamic_discount_rules.${index}.name`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {t('tariffs.ruleName')} *
                                </label>
                                <div className="mt-1">
                                  <Field
                                    type="text"
                                    name={`dynamic_discount_rules.${index}.name`}
                                    id={`dynamic_discount_rules.${index}.name`}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                  />
                                  <ErrorMessage name={`dynamic_discount_rules.${index}.name`} component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                                </div>
                              </div>

                              <div className="sm:col-span-2">
                                <label htmlFor={`dynamic_discount_rules.${index}.condition_type`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {t('tariffs.conditionType')} *
                                </label>
                                <div className="mt-1">
                                  <Field
                                    as="select"
                                    name={`dynamic_discount_rules.${index}.condition_type`}
                                    id={`dynamic_discount_rules.${index}.condition_type`}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                  >
                                    <option value="time_based">{t('tariffs.timeBased')}</option>
                                    <option value="volume_based">{t('tariffs.volumeBased')}</option>
                                    <option value="customer_based">{t('tariffs.customerBased')}</option>
                                  </Field>
                                  <ErrorMessage name={`dynamic_discount_rules.${index}.condition_type`} component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                                </div>
                              </div>

                              <div className="sm:col-span-2">
                                <label htmlFor={`dynamic_discount_rules.${index}.condition_value`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {t('tariffs.conditionValue')} *
                                </label>
                                <div className="mt-1">
                                  <Field
                                    type="text"
                                    name={`dynamic_discount_rules.${index}.condition_value`}
                                    id={`dynamic_discount_rules.${index}.condition_value`}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                  />
                                  <ErrorMessage name={`dynamic_discount_rules.${index}.condition_value`} component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                                </div>
                              </div>

                              <div className="sm:col-span-2">
                                <label htmlFor={`dynamic_discount_rules.${index}.discount_value`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {t('tariffs.discountValue')} *
                                </label>
                                <div className="mt-1">
                                  <Field
                                    type="number"
                                    name={`dynamic_discount_rules.${index}.discount_value`}
                                    id={`dynamic_discount_rules.${index}.discount_value`}
                                    min="0"
                                    step="0.01"
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                  />
                                  <ErrorMessage name={`dynamic_discount_rules.${index}.discount_value`} component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                                </div>
                              </div>

                              <div className="sm:col-span-2">
                                <label htmlFor={`dynamic_discount_rules.${index}.discount_type`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {t('tariffs.discountType')} *
                                </label>
                                <div className="mt-1">
                                  <Field
                                    as="select"
                                    name={`dynamic_discount_rules.${index}.discount_type`}
                                    id={`dynamic_discount_rules.${index}.discount_type`}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                  >
                                    <option value="percentage">{t('tariffs.percentage')}</option>
                                    <option value="fixed">{t('tariffs.fixed')}</option>
                                  </Field>
                                  <ErrorMessage name={`dynamic_discount_rules.${index}.discount_type`} component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                                </div>
                              </div>

                              <div className="sm:col-span-2">
                                <div className="flex items-start">
                                  <div className="flex items-center h-5">
                                    <Field
                                      type="checkbox"
                                      name={`dynamic_discount_rules.${index}.is_active`}
                                      id={`dynamic_discount_rules.${index}.is_active`}
                                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                                    />
                                  </div>
                                  <div className="ml-3 text-sm">
                                    <label htmlFor={`dynamic_discount_rules.${index}.is_active`} className="font-medium text-gray-700 dark:text-gray-300">
                                      {t('common.active')}
                                    </label>
                                  </div>
                                </div>
                              </div>

                              <div className="sm:col-span-2 flex items-end">
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                                >
                                  <MinusIcon className="h-4 w-4 mr-1" />
                                  {t('common.remove')}
                                </button>
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => push({
                              name: '',
                              condition_type: 'time_based',
                              condition_value: '',
                              discount_value: 0,
                              discount_type: 'percentage',
                              is_active: true,
                            })}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                          >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            {t('tariffs.addDynamicDiscount')}
                          </button>
                        </div>
                      )}
                    </FieldArray>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('common.saving')}
                    </span>
                  ) : (
                    isEditMode ? t('common.update') : t('common.save')
                  )}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default TariffForm;