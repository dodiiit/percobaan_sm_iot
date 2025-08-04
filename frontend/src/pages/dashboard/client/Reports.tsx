import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  ArrowDownTrayIcon, 
  CalendarIcon,
  ArrowPathIcon,
  DocumentChartBarIcon,
  TableCellsIcon,
  PresentationChartLineIcon,
  CpuChipIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import api from '../../../services/api';
import { mockApi, shouldUseMockApi } from '../../../services/mockApi';
import { toast } from 'react-toastify';

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  formats: string[];
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
}

const Reports: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [reportFormat, setReportFormat] = useState<string>('pdf');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState<string>('monthly');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedReportUrl, setGeneratedReportUrl] = useState<string | null>(null);

  // Define available report types
  const reportTypes: ReportType[] = [
    {
      id: 'consumption',
      name: 'Water Consumption Report',
      description: 'Detailed water consumption data across all meters',
      icon: <ChartBarIcon className="h-8 w-8 text-blue-500" />,
      formats: ['pdf', 'excel', 'csv'],
      period: 'monthly'
    },
    {
      id: 'revenue',
      name: 'Revenue Report',
      description: 'Financial summary of all payments and revenue',
      icon: <CurrencyDollarIcon className="h-8 w-8 text-green-500" />,
      formats: ['pdf', 'excel'],
      period: 'monthly'
    },
    {
      id: 'customer',
      name: 'Customer Activity Report',
      description: 'Customer usage patterns and account activity',
      icon: <UserGroupIcon className="h-8 w-8 text-purple-500" />,
      formats: ['pdf', 'excel'],
      period: 'monthly'
    },
    {
      id: 'meter',
      name: 'Meter Performance Report',
      description: 'Technical performance data for all meters',
      icon: <CpuChipIcon className="h-8 w-8 text-yellow-500" />,
      formats: ['pdf', 'excel', 'csv'],
      period: 'monthly'
    },
    {
      id: 'maintenance',
      name: 'Maintenance Report',
      description: 'Maintenance history and upcoming maintenance needs',
      icon: <WrenchScrewdriverIcon className="h-8 w-8 text-red-500" />,
      formats: ['pdf', 'excel'],
      period: 'monthly'
    },
    {
      id: 'billing',
      name: 'Billing Summary Report',
      description: 'Summary of all billing and payment activities',
      icon: <DocumentChartBarIcon className="h-8 w-8 text-indigo-500" />,
      formats: ['pdf', 'excel'],
      period: 'monthly'
    }
  ];

  // Set default selected report
  useEffect(() => {
    if (reportTypes.length > 0 && !selectedReport) {
      setSelectedReport(reportTypes[0].id);
    }
  }, [reportTypes]);

  // Set default date range (current month)
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  // Update date range when period changes
  useEffect(() => {
    const now = new Date();
    let start, end;
    
    switch (period) {
      case 'daily':
        start = new Date(now);
        end = new Date(now);
        break;
      case 'weekly':
        // Start of current week (Sunday)
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        // End of current week (Saturday)
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        break;
      case 'monthly':
        // Start of current month
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        // End of current month
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'yearly':
        // Start of current year
        start = new Date(now.getFullYear(), 0, 1);
        // End of current year
        end = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        // Keep current custom range
        return;
    }
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, [period]);

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      
      // Mock API call for report generation
      if (shouldUseMockApi()) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate a mock report URL
        const reportUrl = `https://example.com/reports/${selectedReport}_${startDate}_${endDate}.${reportFormat}`;
        setGeneratedReportUrl(reportUrl);
        toast.success('Report generated successfully');
      } else {
        // Real API call
        const response = await api.post('/reports/generate', {
          report_type: selectedReport,
          format: reportFormat,
          start_date: startDate,
          end_date: endDate
        });
        
        if (response.data.status === 'success') {
          setGeneratedReportUrl(response.data.data.report_url);
          toast.success('Report generated successfully');
        }
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const getSelectedReportType = () => {
    return reportTypes.find(report => report.id === selectedReport);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            Reports
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Generate and download reports for your water service
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Report Types */}
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              Report Types
            </h3>
            <div className="space-y-4">
              {reportTypes.map((report) => (
                <div 
                  key={report.id}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedReport === report.id 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 dark:border-blue-400' 
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-transparent'
                  }`}
                  onClick={() => setSelectedReport(report.id)}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {report.icon}
                    </div>
                    <div className="ml-4">
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">
                        {report.name}
                      </h4>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {report.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {report.formats.map((format) => (
                          <span 
                            key={format}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-300"
                          >
                            {format.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Report Configuration */}
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg lg:col-span-2">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              Report Configuration
            </h3>
            {selectedReport && (
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    {getSelectedReportType()?.icon}
                    <div className="ml-4">
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">
                        {getSelectedReportType()?.name}
                      </h4>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {getSelectedReportType()?.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="report-format" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Report Format
                    </label>
                    <select
                      id="report-format"
                      name="report-format"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={reportFormat}
                      onChange={(e) => setReportFormat(e.target.value)}
                    >
                      {getSelectedReportType()?.formats.map((format) => (
                        <option key={format} value={format}>{format.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="period" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Time Period
                    </label>
                    <select
                      id="period"
                      name="period"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Start Date
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="start-date"
                        id="start-date"
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        disabled={period !== 'custom'}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      End Date
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="end-date"
                        id="end-date"
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        disabled={period !== 'custom'}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">
                        Report Summary
                      </h4>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {getSelectedReportType()?.name} for {formatDate(startDate)} to {formatDate(endDate)} in {reportFormat.toUpperCase()} format
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateReport}
                      disabled={isGenerating}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <>
                          <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <DocumentTextIcon className="-ml-1 mr-2 h-5 w-5" />
                          Generate Report
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {generatedReportUrl && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <DocumentTextIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="ml-3 flex-1 md:flex md:justify-between">
                        <p className="text-sm text-green-700 dark:text-green-400">
                          Your report has been generated successfully.
                        </p>
                        <p className="mt-3 text-sm md:mt-0 md:ml-6">
                          <a
                            href={generatedReportUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="whitespace-nowrap font-medium text-green-700 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300 inline-flex items-center"
                          >
                            <ArrowDownTrayIcon className="-ml-1 mr-1 h-5 w-5" />
                            Download
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="mt-6 bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
            Recent Reports
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Report Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date Range
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Format
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Generated
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {/* Mock recent reports */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-5 w-5 text-blue-500 mr-2" />
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Water Consumption Report</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">July 1, 2024 - July 31, 2024</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400">
                      PDF
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    July 31, 2024
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href="#" className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                      <ArrowDownTrayIcon className="h-5 w-5" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-5 w-5 text-green-500 mr-2" />
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Revenue Report</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">July 1, 2024 - July 31, 2024</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">
                      EXCEL
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    July 31, 2024
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href="#" className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                      <ArrowDownTrayIcon className="h-5 w-5" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserGroupIcon className="h-5 w-5 text-purple-500 mr-2" />
                      <div className="text-sm font-medium text-gray-900 dark:text-white">Customer Activity Report</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">June 1, 2024 - June 30, 2024</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400">
                      PDF
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    June 30, 2024
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a href="#" className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                      <ArrowDownTrayIcon className="h-5 w-5" />
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
