import React, { useState, useEffect } from 'react';
import { valveService, ValveOverview, Valve } from '../../services/valveService';
import ValveControl from './ValveControl';

const ValveDashboard: React.FC = () => {
  const [overview, setOverview] = useState<ValveOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedValve, setSelectedValve] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    status: '',
    state: '',
    search: ''
  });
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    loadOverview();
    const interval = setInterval(loadOverview, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadOverview = async () => {
    try {
      const data = await valveService.getValveOverview();
      setOverview(data);
    } catch (error) {
      console.error('Failed to load valve overview:', error);
      showNotification('error', 'Failed to load valve overview');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCommandSent = (result: any) => {
    showNotification('success', 'Command sent successfully');
    loadOverview(); // Refresh overview
  };

  const handleError = (error: string) => {
    showNotification('error', error);
  };

  const filteredValves = overview?.valves.filter(valve => {
    const matchesStatus = !filter.status || valve.status === filter.status;
    const matchesState = !filter.state || valve.current_state === filter.state;
    const matchesSearch = !filter.search || 
      valve.valve_id.toLowerCase().includes(filter.search.toLowerCase()) ||
      valve.meter_id.toLowerCase().includes(filter.search.toLowerCase()) ||
      valve.property_name.toLowerCase().includes(filter.search.toLowerCase());
    
    return matchesStatus && matchesState && matchesSearch;
  }) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading valve dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`p-4 rounded-md ${
          notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Statistics Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Valves</dt>
                    <dd className="text-lg font-medium text-gray-900">{overview.statistics.valve_statistics.total_valves}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Valves</dt>
                    <dd className="text-lg font-medium text-green-600">{overview.statistics.valve_statistics.active_valves}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Open Valves</dt>
                    <dd className="text-lg font-medium text-green-600">{overview.statistics.valve_statistics.open_valves}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Offline Valves</dt>
                    <dd className="text-lg font-medium text-red-600">{overview.statistics.valve_statistics.offline_valves}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Valve Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              placeholder="Search valve ID, meter ID, or property"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
              <option value="error">Error</option>
              <option value="offline">Offline</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
            <select
              value={filter.state}
              onChange={(e) => setFilter({ ...filter, state: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All States</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="partial">Partial</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilter({ status: '', state: '', search: '' })}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Valve List */}
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valve
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alerts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredValves.map((valve) => (
                <tr key={valve.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{valve.valve_id}</div>
                      <div className="text-sm text-gray-500">{valve.valve_type} valve</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{valve.property_name}</div>
                      <div className="text-sm text-gray-500">{valve.meter_id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      valve.status === 'active' ? 'bg-green-100 text-green-800' :
                      valve.status === 'offline' ? 'bg-red-100 text-red-800' :
                      valve.status === 'maintenance' ? 'bg-blue-100 text-blue-800' :
                      valve.status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {valve.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      valve.current_state === 'open' ? 'bg-green-100 text-green-800' :
                      valve.current_state === 'closed' ? 'bg-red-100 text-red-800' :
                      valve.current_state === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {valveService.getStateIcon(valve.current_state)} {valve.current_state}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${valve.last_credit.toFixed(2)}
                    </div>
                    {valve.last_credit <= valve.low_credit_threshold && (
                      <div className="text-xs text-red-600">Low Credit</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {valve.active_alerts > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {valve.active_alerts} alerts
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedValve(valve.id)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Control
                    </button>
                    <button
                      onClick={() => window.open(`/valves/${valve.id}/history`, '_blank')}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredValves.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No valves found matching the current filters.
          </div>
        )}
      </div>

      {/* System Health Overview */}
      {overview && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold ${
                overview.statistics.system_health === 'normal' ? 'text-green-600' :
                overview.statistics.system_health === 'warning' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {overview.statistics.system_health === 'normal' ? '✓' :
                 overview.statistics.system_health === 'warning' ? '⚠' : '✗'}
              </div>
              <div className="text-sm text-gray-500 mt-2">Overall Health</div>
              <div className={`text-sm font-medium ${
                overview.statistics.system_health === 'normal' ? 'text-green-600' :
                overview.statistics.system_health === 'warning' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {overview.statistics.system_health.charAt(0).toUpperCase() + overview.statistics.system_health.slice(1)}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Offline Valves:</span>
                <span className={`text-sm font-medium ${
                  overview.statistics.health_issues.offline_valves > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {overview.statistics.health_issues.offline_valves}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Low Battery:</span>
                <span className={`text-sm font-medium ${
                  overview.statistics.health_issues.low_battery_valves > 0 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {overview.statistics.health_issues.low_battery_valves}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Maintenance Due:</span>
                <span className={`text-sm font-medium ${
                  overview.statistics.health_issues.maintenance_due > 0 ? 'text-blue-600' : 'text-green-600'
                }`}>
                  {overview.statistics.health_issues.maintenance_due}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pending Commands:</span>
                <span className="text-sm font-medium text-gray-900">
                  {overview.statistics.command_statistics.pending_commands}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Failed Commands:</span>
                <span className={`text-sm font-medium ${
                  overview.statistics.command_statistics.failed_commands > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {overview.statistics.command_statistics.failed_commands}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Battery:</span>
                <span className="text-sm font-medium text-gray-900">
                  {overview.statistics.valve_statistics.avg_battery_level?.toFixed(1) || 'N/A'}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Valve Control Modal */}
      {selectedValve && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Valve Control</h3>
              <button
                onClick={() => setSelectedValve(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ValveControl
              valveId={selectedValve}
              onCommandSent={handleCommandSent}
              onError={handleError}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ValveDashboard;