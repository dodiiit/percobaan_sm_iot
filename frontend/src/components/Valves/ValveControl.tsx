import React, { useState, useEffect } from 'react';
import { valveService, Valve, ValveStatus, ValveCommand } from '../../services/valveService';

interface ValveControlProps {
  valveId: string;
  onCommandSent?: (command: any) => void;
  onError?: (error: string) => void;
}

const ValveControl: React.FC<ValveControlProps> = ({ valveId, onCommandSent, onError }) => {
  const [valveStatus, setValveStatus] = useState<ValveStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [commandLoading, setCommandLoading] = useState<string | null>(null);
  const [showPartialDialog, setShowPartialDialog] = useState(false);
  const [partialPercentage, setPartialPercentage] = useState(50);
  const [commandReason, setCommandReason] = useState('');
  const [showReasonDialog, setShowReasonDialog] = useState<string | null>(null);

  useEffect(() => {
    loadValveStatus();
    const interval = setInterval(loadValveStatus, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [valveId]);

  const loadValveStatus = async () => {
    try {
      const status = await valveService.getValve(valveId);
      setValveStatus(status);
    } catch (error) {
      console.error('Failed to load valve status:', error);
      onError?.('Failed to load valve status');
    } finally {
      setLoading(false);
    }
  };

  const sendCommand = async (commandType: string, additionalData: any = {}) => {
    if (!valveStatus) return;

    setCommandLoading(commandType);
    try {
      let result;
      const commandData = {
        reason: commandReason || `${commandType} command`,
        priority: 'normal',
        ...additionalData
      };

      switch (commandType) {
        case 'open':
          result = await valveService.openValve(valveId, commandData);
          break;
        case 'close':
          result = await valveService.closeValve(valveId, commandData);
          break;
        case 'partial_open':
          result = await valveService.partialOpenValve(valveId, partialPercentage, commandData);
          break;
        case 'emergency_close':
          result = await valveService.emergencyCloseValve(valveId, { ...commandData, priority: 'emergency' });
          break;
        case 'status_check':
          result = await valveService.checkValveStatus(valveId);
          break;
      }

      onCommandSent?.(result);
      setCommandReason('');
      setShowReasonDialog(null);
      setShowPartialDialog(false);
      
      // Refresh status after command
      setTimeout(loadValveStatus, 1000);
      
    } catch (error: any) {
      console.error('Command failed:', error);
      onError?.(error.response?.data?.message || 'Command failed');
    } finally {
      setCommandLoading(null);
    }
  };

  const handleCommandClick = (commandType: string) => {
    if (commandType === 'partial_open') {
      setShowPartialDialog(true);
    } else if (commandType === 'emergency_close') {
      setShowReasonDialog(commandType);
    } else {
      sendCommand(commandType);
    }
  };

  const handlePartialOpen = () => {
    sendCommand('partial_open');
  };

  const handleEmergencyClose = () => {
    sendCommand('emergency_close');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading valve status...</span>
      </div>
    );
  }

  if (!valveStatus) {
    return (
      <div className="text-center p-8 text-red-600">
        Failed to load valve status
      </div>
    );
  }

  const { valve } = valveStatus;
  const isCommandDisabled = valve.status === 'inactive' || valve.status === 'maintenance' || commandLoading !== null;
  const isOverrideActive = valve.is_manual_override;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Valve Status Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Valve Control: {valve.valve_id}
          </h3>
          <p className="text-sm text-gray-600">
            {valve.valve_type.charAt(0).toUpperCase() + valve.valve_type.slice(1)} Valve
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              valve.status === 'active' ? 'bg-green-100 text-green-800' :
              valve.status === 'offline' ? 'bg-red-100 text-red-800' :
              valve.status === 'maintenance' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {valve.status.charAt(0).toUpperCase() + valve.status.slice(1)}
            </div>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              valve.current_state === 'open' ? 'bg-green-100 text-green-800' :
              valve.current_state === 'closed' ? 'bg-red-100 text-red-800' :
              valve.current_state === 'partial' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {valveService.getStateIcon(valve.current_state)} {valve.current_state.charAt(0).toUpperCase() + valve.current_state.slice(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Override Warning */}
      {isOverrideActive && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Manual Override Active</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>This valve is in manual override mode. Only emergency commands are allowed.</p>
                {valve.manual_override_reason && (
                  <p className="mt-1"><strong>Reason:</strong> {valve.manual_override_reason}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => handleCommandClick('open')}
          disabled={isCommandDisabled || (isOverrideActive && valve.current_state === 'open')}
          className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
            commandLoading === 'open' ? 'bg-blue-50 border-blue-300' :
            valve.current_state === 'open' ? 'bg-green-50 border-green-300 text-green-700' :
            isCommandDisabled ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed' :
            'bg-white border-gray-300 hover:border-green-400 hover:bg-green-50'
          }`}
        >
          {commandLoading === 'open' ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          ) : (
            <svg className="h-6 w-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          )}
          <span className="text-sm font-medium">Open</span>
        </button>

        <button
          onClick={() => handleCommandClick('close')}
          disabled={isCommandDisabled || (isOverrideActive && valve.current_state === 'closed')}
          className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
            commandLoading === 'close' ? 'bg-blue-50 border-blue-300' :
            valve.current_state === 'closed' ? 'bg-red-50 border-red-300 text-red-700' :
            isCommandDisabled ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed' :
            'bg-white border-gray-300 hover:border-red-400 hover:bg-red-50'
          }`}
        >
          {commandLoading === 'close' ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          ) : (
            <svg className="h-6 w-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )}
          <span className="text-sm font-medium">Close</span>
        </button>

        <button
          onClick={() => handleCommandClick('partial_open')}
          disabled={isCommandDisabled || isOverrideActive}
          className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
            commandLoading === 'partial_open' ? 'bg-blue-50 border-blue-300' :
            valve.current_state === 'partial' ? 'bg-yellow-50 border-yellow-300 text-yellow-700' :
            isCommandDisabled || isOverrideActive ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed' :
            'bg-white border-gray-300 hover:border-yellow-400 hover:bg-yellow-50'
          }`}
        >
          {commandLoading === 'partial_open' ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          ) : (
            <svg className="h-6 w-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 002-2v-6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 002 2H6z" />
            </svg>
          )}
          <span className="text-sm font-medium">Partial</span>
        </button>

        <button
          onClick={() => handleCommandClick('emergency_close')}
          disabled={commandLoading !== null}
          className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
            commandLoading === 'emergency_close' ? 'bg-blue-50 border-blue-300' :
            'bg-white border-red-300 hover:border-red-500 hover:bg-red-50 text-red-600'
          }`}
        >
          {commandLoading === 'emergency_close' ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          ) : (
            <svg className="h-6 w-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          )}
          <span className="text-sm font-medium">Emergency</span>
        </button>
      </div>

      {/* Valve Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Device Status</h4>
          <div className="space-y-2 text-sm">
            {valve.battery_level !== null && valve.battery_level !== undefined && (
              <div className="flex justify-between">
                <span>Battery:</span>
                <span className={valve.battery_level < 20 ? 'text-red-600' : 'text-gray-900'}>
                  {valve.battery_level}%
                </span>
              </div>
            )}
            {valve.signal_strength !== null && valve.signal_strength !== undefined && (
              <div className="flex justify-between">
                <span>Signal:</span>
                <span className={valve.signal_strength < -80 ? 'text-red-600' : 'text-gray-900'}>
                  {valve.signal_strength} dBm
                </span>
              </div>
            )}
            {valve.operating_pressure !== null && valve.operating_pressure !== undefined && (
              <div className="flex justify-between">
                <span>Pressure:</span>
                <span className={valve.operating_pressure > (valve.max_pressure || 0) * 0.9 ? 'text-red-600' : 'text-gray-900'}>
                  {valve.operating_pressure} bar
                </span>
              </div>
            )}
            {valve.temperature !== null && (
              <div className="flex justify-between">
                <span>Temperature:</span>
                <span>{valve.temperature}°C</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Last Activity</h4>
          <div className="space-y-2 text-sm">
            {valve.last_command && (
              <div className="flex justify-between">
                <span>Last Command:</span>
                <span className="capitalize">{valve.last_command.replace('_', ' ')}</span>
              </div>
            )}
            {valve.last_command_at && (
              <div className="flex justify-between">
                <span>Command Time:</span>
                <span>{new Date(valve.last_command_at).toLocaleString()}</span>
              </div>
            )}
            {valve.last_response_at && (
              <div className="flex justify-between">
                <span>Last Response:</span>
                <span>{new Date(valve.last_response_at).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Configuration</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Auto Close:</span>
              <span className={valve.auto_close_enabled ? 'text-green-600' : 'text-red-600'}>
                {valve.auto_close_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Emergency Close:</span>
              <span className={valve.emergency_close_enabled ? 'text-green-600' : 'text-red-600'}>
                {valve.emergency_close_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Max Pressure:</span>
              <span>{valve.max_pressure} bar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {valveStatus.active_alerts.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Active Alerts</h4>
          <div className="space-y-2">
            {valveStatus.active_alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${
                  alert.severity === 'emergency' ? 'bg-red-50 border-red-200' :
                  alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                  alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-sm font-medium">{alert.title}</h5>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    alert.severity === 'emergency' ? 'bg-red-100 text-red-800' :
                    alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Commands */}
      {valveStatus.recent_commands.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Commands</h4>
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Command
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {valveStatus.recent_commands.slice(0, 5).map((command) => (
                  <tr key={command.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="capitalize">{command.command_type.replace('_', ' ')}</span>
                      {command.priority === 'emergency' && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Emergency
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        command.status === 'completed' ? 'bg-green-100 text-green-800' :
                        command.status === 'failed' ? 'bg-red-100 text-red-800' :
                        command.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {command.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(command.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {command.initiated_by_name || command.initiated_by}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Partial Open Dialog */}
      {showPartialDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Partial Open Valve</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opening Percentage: {partialPercentage}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={partialPercentage}
                  onChange={(e) => setPartialPercentage(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={commandReason}
                  onChange={(e) => setCommandReason(e.target.value)}
                  placeholder="Enter reason for partial opening"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowPartialDialog(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePartialOpen}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Send Command
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Close Dialog */}
      {showReasonDialog === 'emergency_close' && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-red-600 mb-4">Emergency Close Valve</h3>
              <p className="text-sm text-gray-600 mb-4">
                This will immediately close the valve with high priority. Please provide a reason for this emergency action.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Reason *
                </label>
                <textarea
                  value={commandReason}
                  onChange={(e) => setCommandReason(e.target.value)}
                  placeholder="Enter reason for emergency close"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowReasonDialog(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEmergencyClose}
                  disabled={!commandReason.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-400"
                >
                  Emergency Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValveControl;