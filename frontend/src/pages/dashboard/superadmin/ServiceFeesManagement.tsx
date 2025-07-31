import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tab } from '@headlessui/react';
import ServiceFeePlanList from '../../../components/serviceFees/ServiceFeePlanList';
import ServiceFeePlanForm from '../../../components/serviceFees/ServiceFeePlanForm';
import ServiceFeePlanDetail from '../../../components/serviceFees/ServiceFeePlanDetail';
import ServiceFeeInvoiceList from '../../../components/serviceFees/ServiceFeeInvoiceList';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { generateMonthlyServiceFeeInvoice, generateCustomServiceFeeInvoice } from '../../../services/serviceFeeService';
import { toast } from 'react-toastify';

const ServiceFeesManagement: React.FC = () => {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'detail'>('list');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState<boolean>(false);
  const [isMonthlyInvoice, setIsMonthlyInvoice] = useState<boolean>(true);
  const [selectedClientId, setSelectedClientId] = useState<string>('client-123'); // In a real app, this would come from a dropdown or context
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleAddPlan = () => {
    setSelectedPlanId(null);
    setView('create');
  };

  const handleEditPlan = (id: string) => {
    setSelectedPlanId(id);
    setView('edit');
  };

  const handleViewPlan = (id: string) => {
    setSelectedPlanId(id);
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

  const handleOpenGenerateModal = () => {
    setIsGenerateModalOpen(true);
  };

  const handleCloseGenerateModal = () => {
    setIsGenerateModalOpen(false);
  };

  const handleGenerateInvoice = async (values: any) => {
    try {
      setIsLoading(true);
      if (isMonthlyInvoice) {
        await generateMonthlyServiceFeeInvoice(selectedClientId, {
          year: values.year,
          month: values.month,
          issue_date: values.issue_date,
          due_date: values.due_date,
          notes: values.notes
        });
        toast.success(t('serviceFees.generateMonthlySuccess'));
      } else {
        await generateCustomServiceFeeInvoice(selectedClientId, {
          start_date: values.start_date,
          end_date: values.end_date,
          issue_date: values.issue_date,
          due_date: values.due_date,
          notes: values.notes
        });
        toast.success(t('serviceFees.generateCustomSuccess'));
      }
      handleCloseGenerateModal();
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('serviceFees.generateError'));
    } finally {
      setIsLoading(false);
    }
  };

  const monthlyValidationSchema = Yup.object({
    year: Yup.string().required(t('validation.required')),
    month: Yup.string().required(t('validation.required')),
    due_date: Yup.date().nullable(),
    issue_date: Yup.date().nullable(),
  });

  const customValidationSchema = Yup.object({
    start_date: Yup.date().required(t('validation.required')),
    end_date: Yup.date().required(t('validation.required'))
      .min(Yup.ref('start_date'), t('validation.endDateAfterStartDate')),
    due_date: Yup.date().nullable(),
    issue_date: Yup.date().nullable(),
  });

  return (
    <div>
      <div className="pb-5 border-b border-gray-200 dark:border-gray-700 sm:flex sm:items-center sm:justify-between">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
          {t('serviceFees.management')}
        </h3>
      </div>

      <div className="mt-6">
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 dark:text-blue-400
                 ${selected ? 'bg-white dark:bg-gray-800 shadow' : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-600 dark:hover:text-blue-300'}`
              }
            >
              {t('serviceFees.plans')}
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 dark:text-blue-400
                 ${selected ? 'bg-white dark:bg-gray-800 shadow' : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-600 dark:hover:text-blue-300'}`
              }
            >
              {t('serviceFees.invoices')}
            </Tab>
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-blue-700 dark:text-blue-400
                 ${selected ? 'bg-white dark:bg-gray-800 shadow' : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-600 dark:hover:text-blue-300'}`
              }
            >
              {t('serviceFees.reports')}
            </Tab>
          </Tab.List>
          <Tab.Panels className="mt-2">
            {/* Plans Tab */}
            <Tab.Panel>
              {view === 'list' && (
                <ServiceFeePlanList
                  onEdit={handleEditPlan}
                  onView={handleViewPlan}
                  onAdd={handleAddPlan}
                  onRefresh={handleRefresh}
                  key={refreshKey}
                />
              )}

              {(view === 'create' || view === 'edit') && (
                <ServiceFeePlanForm
                  planId={view === 'edit' ? selectedPlanId! : undefined}
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormCancel}
                />
              )}

              {view === 'detail' && selectedPlanId && (
                <ServiceFeePlanDetail
                  planId={selectedPlanId}
                  onClose={handleFormCancel}
                />
              )}
            </Tab.Panel>

            {/* Invoices Tab */}
            <Tab.Panel>
              <ServiceFeeInvoiceList
                clientId={selectedClientId}
                onView={() => {}} // TODO: Implement invoice detail view
                onGenerate={handleOpenGenerateModal}
                key={refreshKey}
              />
            </Tab.Panel>

            {/* Reports Tab */}
            <Tab.Panel>
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {t('serviceFees.reports')}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {t('serviceFees.reportsDescription')}
                </p>
                <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white">
                      {t('serviceFees.clientFeeReport')}
                    </h4>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {t('serviceFees.clientFeeReportDescription')}
                    </p>
                    <button
                      className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {t('serviceFees.generateReport')}
                    </button>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white">
                      {t('serviceFees.accrualReport')}
                    </h4>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {t('serviceFees.accrualReportDescription')}
                    </p>
                    <button
                      className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {t('serviceFees.generateReport')}
                    </button>
                  </div>
                </div>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>

      {/* Generate Invoice Modal */}
      <Transition appear show={isGenerateModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={handleCloseGenerateModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25 dark:bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                  >
                    {t('serviceFees.generateInvoice')}
                  </Dialog.Title>
                  <div className="mt-2">
                    <div className="flex space-x-4 mb-4">
                      <button
                        type="button"
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          isMonthlyInvoice
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                        onClick={() => setIsMonthlyInvoice(true)}
                      >
                        {t('serviceFees.monthlyInvoice')}
                      </button>
                      <button
                        type="button"
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          !isMonthlyInvoice
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                        onClick={() => setIsMonthlyInvoice(false)}
                      >
                        {t('serviceFees.customInvoice')}
                      </button>
                    </div>

                    {isMonthlyInvoice ? (
                      <Formik
                        initialValues={{
                          year: new Date().getFullYear().toString(),
                          month: (new Date().getMonth() + 1).toString().padStart(2, '0'),
                          issue_date: '',
                          due_date: '',
                          notes: ''
                        }}
                        validationSchema={monthlyValidationSchema}
                        onSubmit={handleGenerateInvoice}
                      >
                        <Form className="space-y-4">
                          <div>
                            <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t('serviceFees.year')} *
                            </label>
                            <Field
                              type="text"
                              name="year"
                              id="year"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                            <ErrorMessage name="year" component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <label htmlFor="month" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t('serviceFees.month')} *
                            </label>
                            <Field
                              as="select"
                              name="month"
                              id="month"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                              <option value="01">{t('months.january')}</option>
                              <option value="02">{t('months.february')}</option>
                              <option value="03">{t('months.march')}</option>
                              <option value="04">{t('months.april')}</option>
                              <option value="05">{t('months.may')}</option>
                              <option value="06">{t('months.june')}</option>
                              <option value="07">{t('months.july')}</option>
                              <option value="08">{t('months.august')}</option>
                              <option value="09">{t('months.september')}</option>
                              <option value="10">{t('months.october')}</option>
                              <option value="11">{t('months.november')}</option>
                              <option value="12">{t('months.december')}</option>
                            </Field>
                            <ErrorMessage name="month" component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <label htmlFor="issue_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t('serviceFees.issueDate')}
                            </label>
                            <Field
                              type="date"
                              name="issue_date"
                              id="issue_date"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                            <ErrorMessage name="issue_date" component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t('serviceFees.dueDate')}
                            </label>
                            <Field
                              type="date"
                              name="due_date"
                              id="due_date"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                            <ErrorMessage name="due_date" component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t('serviceFees.notes')}
                            </label>
                            <Field
                              as="textarea"
                              name="notes"
                              id="notes"
                              rows={3}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div className="mt-4 flex justify-end space-x-3">
                            <button
                              type="button"
                              className="inline-flex justify-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                              onClick={handleCloseGenerateModal}
                            >
                              {t('common.cancel')}
                            </button>
                            <button
                              type="submit"
                              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <span className="flex items-center">
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  {t('common.generating')}
                                </span>
                              ) : (
                                t('common.generate')
                              )}
                            </button>
                          </div>
                        </Form>
                      </Formik>
                    ) : (
                      <Formik
                        initialValues={{
                          start_date: '',
                          end_date: '',
                          issue_date: '',
                          due_date: '',
                          notes: ''
                        }}
                        validationSchema={customValidationSchema}
                        onSubmit={handleGenerateInvoice}
                      >
                        <Form className="space-y-4">
                          <div>
                            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t('serviceFees.startDate')} *
                            </label>
                            <Field
                              type="date"
                              name="start_date"
                              id="start_date"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                            <ErrorMessage name="start_date" component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t('serviceFees.endDate')} *
                            </label>
                            <Field
                              type="date"
                              name="end_date"
                              id="end_date"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                            <ErrorMessage name="end_date" component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <label htmlFor="issue_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t('serviceFees.issueDate')}
                            </label>
                            <Field
                              type="date"
                              name="issue_date"
                              id="issue_date"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                            <ErrorMessage name="issue_date" component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t('serviceFees.dueDate')}
                            </label>
                            <Field
                              type="date"
                              name="due_date"
                              id="due_date"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                            <ErrorMessage name="due_date" component="div" className="mt-1 text-sm text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t('serviceFees.notes')}
                            </label>
                            <Field
                              as="textarea"
                              name="notes"
                              id="notes"
                              rows={3}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div className="mt-4 flex justify-end space-x-3">
                            <button
                              type="button"
                              className="inline-flex justify-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                              onClick={handleCloseGenerateModal}
                            >
                              {t('common.cancel')}
                            </button>
                            <button
                              type="submit"
                              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <span className="flex items-center">
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  {t('common.generating')}
                                </span>
                              ) : (
                                t('common.generate')
                              )}
                            </button>
                          </div>
                        </Form>
                      </Formik>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default ServiceFeesManagement;