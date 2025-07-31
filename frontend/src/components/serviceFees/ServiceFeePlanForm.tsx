import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { createServiceFeePlan, updateServiceFeePlan, getServiceFeePlan } from '../../services/serviceFeeService';

interface ServiceFeePlanFormProps {
  planId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface ServiceFeePlanFormValues {
  name: string;
  description: string;
  is_active: boolean;
  components: {
    name: string;
    fee_type: string;
    fee_value: number;
    min_transaction_amount: number | null;
    max_transaction_amount: number | null;
    min_fee_amount: number | null;
    max_fee_amount: number | null;
    is_active: boolean;
    has_tiers: boolean;
    tiers: {
      min_amount: number;
      max_amount: number | null;
      fee_value: number;
    }[];
  }[];
}

const initialValues: ServiceFeePlanFormValues = {
  name: '',
  description: '',
  is_active: true,
  components: [],
};

const ServiceFeePlanForm: React.FC<ServiceFeePlanFormProps> = ({ planId, onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(false);
  const [initialFormValues, setInitialFormValues] = useState<ServiceFeePlanFormValues>(initialValues);
  const [isEditMode, setIsEditMode] = useState<boolean>(!!planId);

  const validationSchema = Yup.object({
    name: Yup.string().required(t('validation.required')),
    components: Yup.array().of(
      Yup.object({
        name: Yup.string().required(t('validation.required')),
        fee_type: Yup.string().required(t('validation.required')),
        fee_value: Yup.number()
          .required(t('validation.required'))
          .min(0, t('validation.minValue', { value: 0 })),
        min_transaction_amount: Yup.number()
          .nullable()
          .transform((value) => (isNaN(value) ? null : value))
          .min(0, t('validation.minValue', { value: 0 })),
        max_transaction_amount: Yup.number()
          .nullable()
          .transform((value) => (isNaN(value) ? null : value))
          .min(0, t('validation.minValue', { value: 0 })),
        min_fee_amount: Yup.number()
          .nullable()
          .transform((value) => (isNaN(value) ? null : value))
          .min(0, t('validation.minValue', { value: 0 })),
        max_fee_amount: Yup.number()
          .nullable()
          .transform((value) => (isNaN(value) ? null : value))
          .min(0, t('validation.minValue', { value: 0 })),
        tiers: Yup.array().when('has_tiers', {
          is: true,
          then: Yup.array().of(
            Yup.object({
              min_amount: Yup.number()
                .required(t('validation.required'))
                .min(0, t('validation.minValue', { value: 0 })),
              max_amount: Yup.number()
                .nullable()
                .transform((value) => (isNaN(value) ? null : value))
                .min(0, t('validation.minValue', { value: 0 })),
              fee_value: Yup.number()
                .required(t('validation.required'))
                .min(0, t('validation.minValue', { value: 0 })),
            })
          ),
          otherwise: Yup.array(),
        }),
      })
    ),
  });

  useEffect(() => {
    const fetchPlan = async () => {
      if (planId) {
        try {
          setLoading(true);
          const response = await getServiceFeePlan(planId);
          const plan = response.data.data;
          
          // Get components with tiers
          const componentsResponse = await getServiceFeePlanWithComponents(planId);
          const components = componentsResponse.data.data.components || [];
          
          // Transform API data to form values
          const formValues: ServiceFeePlanFormValues = {
            name: plan.name,
            description: plan.description || '',
            is_active: plan.is_active,
            components: components.map((component: any) => ({
              id: component.id,
              name: component.name,
              fee_type: component.fee_type,
              fee_value: component.fee_value,
              min_transaction_amount: component.min_transaction_amount,
              max_transaction_amount: component.max_transaction_amount,
              min_fee_amount: component.min_fee_amount,
              max_fee_amount: component.max_fee_amount,
              is_active: component.is_active,
              has_tiers: ['tiered_percentage', 'tiered_fixed'].includes(component.fee_type),
              tiers: component.tiers || [],
            })),
          };
          
          setInitialFormValues(formValues);
        } catch (err: any) {
          toast.error(err.response?.data?.message || t('serviceFees.fetchError'));
        } finally {
          setLoading(false);
        }
      }
    };

    fetchPlan();
  }, [planId, t]);

  const handleSubmit = async (values: ServiceFeePlanFormValues) => {
    try {
      setLoading(true);
      
      // Prepare data for API
      const planData = {
        name: values.name,
        description: values.description,
        is_active: values.is_active,
        components: values.components.map(component => {
          const componentData: any = {
            name: component.name,
            fee_type: component.fee_type,
            fee_value: component.fee_value,
            min_transaction_amount: component.min_transaction_amount,
            max_transaction_amount: component.max_transaction_amount,
            min_fee_amount: component.min_fee_amount,
            max_fee_amount: component.max_fee_amount,
            is_active: component.is_active,
          };
          
          if (['tiered_percentage', 'tiered_fixed'].includes(component.fee_type) && component.has_tiers) {
            componentData.tiers = component.tiers;
          }
          
          if (component.id) {
            componentData.id = component.id;
          }
          
          return componentData;
        }),
      };
      
      if (isEditMode) {
        await updateServiceFeePlan(planId!, planData);
        toast.success(t('serviceFees.updateSuccess'));
      } else {
        await createServiceFeePlan(planData);
        toast.success(t('serviceFees.createSuccess'));
      }
      
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('serviceFees.saveError'));
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
          {isEditMode ? t('serviceFees.editPlan') : t('serviceFees.createPlan')}
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
                <div className="sm:col-span-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('serviceFees.planName')} *
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

                <div className="sm:col-span-2">
                  <label htmlFor="is_active" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('serviceFees.status')}
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
                    {t('serviceFees.description')}
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

                {/* Fee Components */}
                <div className="sm:col-span-6">
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('serviceFees.components')}</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {t('serviceFees.componentsDescription')}
                    </p>
                  </div>
                  <FieldArray name="components">
                    {({ push, remove }) => (
                      <div className="mt-4">
                        {values.components.map((_, index) => (
                          <div key={index} className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                              <div className="sm:col-span-3">
                                <label htmlFor={`components.${index}.name`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {t('serviceFees.componentName')} *
                                </label>
                                <div className="mt-1">
                                  <Field
                                    type="text"
                                    name={`components.${index}.name`}
                                    id={`components.${index}.name`}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                  />
                                  <ErrorMessage name={`components.${index}.name`} component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                                </div>
                              </div>

                              <div className="sm:col-span-3">
                                <label htmlFor={`components.${index}.fee_type`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {t('serviceFees.feeType')} *
                                </label>
                                <div className="mt-1">
                                  <Field
                                    as="select"
                                    name={`components.${index}.fee_type`}
                                    id={`components.${index}.fee_type`}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                      const value = e.target.value;
                                      setFieldValue(`components.${index}.fee_type`, value);
                                      setFieldValue(`components.${index}.has_tiers`, ['tiered_percentage', 'tiered_fixed'].includes(value));
                                    }}
                                  >
                                    <option value="percentage">{t('serviceFees.percentage')}</option>
                                    <option value="fixed">{t('serviceFees.fixed')}</option>
                                    <option value="tiered_percentage">{t('serviceFees.tieredPercentage')}</option>
                                    <option value="tiered_fixed">{t('serviceFees.tieredFixed')}</option>
                                  </Field>
                                  <ErrorMessage name={`components.${index}.fee_type`} component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                                </div>
                              </div>

                              {!['tiered_percentage', 'tiered_fixed'].includes(values.components[index].fee_type) && (
                                <div className="sm:col-span-2">
                                  <label htmlFor={`components.${index}.fee_value`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('serviceFees.feeValue')} *
                                  </label>
                                  <div className="mt-1">
                                    <Field
                                      type="number"
                                      name={`components.${index}.fee_value`}
                                      id={`components.${index}.fee_value`}
                                      min="0"
                                      step="0.01"
                                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                    />
                                    <ErrorMessage name={`components.${index}.fee_value`} component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                                  </div>
                                </div>
                              )}

                              <div className="sm:col-span-2">
                                <label htmlFor={`components.${index}.min_transaction_amount`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {t('serviceFees.minTransactionAmount')}
                                </label>
                                <div className="mt-1">
                                  <Field
                                    type="number"
                                    name={`components.${index}.min_transaction_amount`}
                                    id={`components.${index}.min_transaction_amount`}
                                    min="0"
                                    step="0.01"
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                  />
                                  <ErrorMessage name={`components.${index}.min_transaction_amount`} component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                                </div>
                              </div>

                              <div className="sm:col-span-2">
                                <label htmlFor={`components.${index}.max_transaction_amount`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {t('serviceFees.maxTransactionAmount')}
                                </label>
                                <div className="mt-1">
                                  <Field
                                    type="number"
                                    name={`components.${index}.max_transaction_amount`}
                                    id={`components.${index}.max_transaction_amount`}
                                    min="0"
                                    step="0.01"
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                  />
                                  <ErrorMessage name={`components.${index}.max_transaction_amount`} component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                                </div>
                              </div>

                              <div className="sm:col-span-2">
                                <label htmlFor={`components.${index}.min_fee_amount`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {t('serviceFees.minFeeAmount')}
                                </label>
                                <div className="mt-1">
                                  <Field
                                    type="number"
                                    name={`components.${index}.min_fee_amount`}
                                    id={`components.${index}.min_fee_amount`}
                                    min="0"
                                    step="0.01"
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                  />
                                  <ErrorMessage name={`components.${index}.min_fee_amount`} component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                                </div>
                              </div>

                              <div className="sm:col-span-2">
                                <label htmlFor={`components.${index}.max_fee_amount`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {t('serviceFees.maxFeeAmount')}
                                </label>
                                <div className="mt-1">
                                  <Field
                                    type="number"
                                    name={`components.${index}.max_fee_amount`}
                                    id={`components.${index}.max_fee_amount`}
                                    min="0"
                                    step="0.01"
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                  />
                                  <ErrorMessage name={`components.${index}.max_fee_amount`} component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                                </div>
                              </div>

                              <div className="sm:col-span-2">
                                <div className="flex items-start">
                                  <div className="flex items-center h-5">
                                    <Field
                                      type="checkbox"
                                      name={`components.${index}.is_active`}
                                      id={`components.${index}.is_active`}
                                      className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                                    />
                                  </div>
                                  <div className="ml-3 text-sm">
                                    <label htmlFor={`components.${index}.is_active`} className="font-medium text-gray-700 dark:text-gray-300">
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

                              {/* Fee Tiers for tiered components */}
                              {['tiered_percentage', 'tiered_fixed'].includes(values.components[index].fee_type) && values.components[index].has_tiers && (
                                <div className="sm:col-span-6">
                                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                                    <h4 className="text-md font-medium text-gray-900 dark:text-white">{t('serviceFees.feeTiers')}</h4>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                      {t('serviceFees.feeTiersDescription')}
                                    </p>
                                  </div>
                                  <FieldArray name={`components.${index}.tiers`}>
                                    {({ push: pushTier, remove: removeTier }) => (
                                      <div className="mt-4">
                                        {values.components[index].tiers && values.components[index].tiers.map((_, tierIndex) => (
                                          <div key={tierIndex} className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                                            <div className="sm:col-span-2">
                                              <label htmlFor={`components.${index}.tiers.${tierIndex}.min_amount`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {t('serviceFees.minAmount')} *
                                              </label>
                                              <div className="mt-1">
                                                <Field
                                                  type="number"
                                                  name={`components.${index}.tiers.${tierIndex}.min_amount`}
                                                  id={`components.${index}.tiers.${tierIndex}.min_amount`}
                                                  min="0"
                                                  step="0.01"
                                                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                                />
                                                <ErrorMessage name={`components.${index}.tiers.${tierIndex}.min_amount`} component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                                              </div>
                                            </div>

                                            <div className="sm:col-span-2">
                                              <label htmlFor={`components.${index}.tiers.${tierIndex}.max_amount`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {t('serviceFees.maxAmount')}
                                              </label>
                                              <div className="mt-1">
                                                <Field
                                                  type="number"
                                                  name={`components.${index}.tiers.${tierIndex}.max_amount`}
                                                  id={`components.${index}.tiers.${tierIndex}.max_amount`}
                                                  min="0"
                                                  step="0.01"
                                                  placeholder={t('serviceFees.noLimit')}
                                                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                                />
                                                <ErrorMessage name={`components.${index}.tiers.${tierIndex}.max_amount`} component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                                              </div>
                                            </div>

                                            <div className="sm:col-span-2">
                                              <label htmlFor={`components.${index}.tiers.${tierIndex}.fee_value`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {t('serviceFees.feeValue')} *
                                              </label>
                                              <div className="mt-1">
                                                <Field
                                                  type="number"
                                                  name={`components.${index}.tiers.${tierIndex}.fee_value`}
                                                  id={`components.${index}.tiers.${tierIndex}.fee_value`}
                                                  min="0"
                                                  step="0.01"
                                                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                                                />
                                                <ErrorMessage name={`components.${index}.tiers.${tierIndex}.fee_value`} component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                                              </div>
                                            </div>

                                            <div className="sm:col-span-2 flex items-end">
                                              <button
                                                type="button"
                                                onClick={() => removeTier(tierIndex)}
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
                                          onClick={() => pushTier({
                                            min_amount: 0,
                                            max_amount: null,
                                            fee_value: 0,
                                          })}
                                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                                        >
                                          <PlusIcon className="h-4 w-4 mr-1" />
                                          {t('serviceFees.addTier')}
                                        </button>
                                      </div>
                                    )}
                                  </FieldArray>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => push({
                            name: '',
                            fee_type: 'percentage',
                            fee_value: 0,
                            min_transaction_amount: null,
                            max_transaction_amount: null,
                            min_fee_amount: null,
                            max_fee_amount: null,
                            is_active: true,
                            has_tiers: false,
                            tiers: [],
                          })}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          {t('serviceFees.addComponent')}
                        </button>
                      </div>
                    )}
                  </FieldArray>
                </div>
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

export default ServiceFeePlanForm;