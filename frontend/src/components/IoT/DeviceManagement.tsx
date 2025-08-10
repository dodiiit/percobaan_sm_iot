import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Alert,
  CircularProgress,
  LinearProgress,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  useTheme,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Refresh,
  PowerSettingsNew,
  Settings,
  Update,
  CloudDownload,
  Wifi,
  WifiOff,
  Battery90,
  BatteryAlert,
  Memory,
  Storage,
  Thermostat,
  Speed,
  WaterDrop,
  Timeline,
  Code,
  BugReport,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { enhancedApi } from '../../services/enhancedApi';
import { enhancedRealtimeService } from '../../services/enhancedRealtimeService';
import { useAuth } from '../../contexts/AuthContext';

interface IoTDevice {
  id: string;
  device_id: string;
  name: string;
  type: 'water_meter' | 'valve_controller' | 'sensor_hub' | 'gateway';
  status: 'online' | 'offline' | 'maintenance' | 'error';
  firmware_version: string;
  hardware_version: string;
  location: string;
  ip_address?: string;
  mac_address: string;
  last_seen: string;
  battery_level?: number;
  signal_strength: number;
  temperature?: number;
  memory_usage?: number;
  storage_usage?: number;
  uptime: number;
  configuration: any;
  alerts: string[];
  created_at: string;
  updated_at: string;
}

interface DeviceCommand {
  id: string;
  device_id: string;
  command_type: 'reboot' | 'update_config' | 'firmware_update' | 'calibrate' | 'reset' | 'custom';
  command_data: any;
  status: 'pending' | 'sent' | 'acknowledged' | 'completed' | 'failed' | 'timeout';
  response?: any;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

interface FirmwareUpdate {
  id: string;
  version: string;
  description: string;
  file_url: string;
  file_size: number;
  checksum: string;
  compatible_devices: string[];
  release_date: string;
  is_critical: boolean;
}

const DeviceManagement: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<IoTDevice | null>(null);
  const [commands, setCommands] = useState<DeviceCommand[]>([]);
  const [firmwareUpdates, setFirmwareUpdates] = useState<FirmwareUpdate[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  
  // Dialog states
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [commandDialogOpen, setCommandDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [firmwareDialogOpen, setFirmwareDialogOpen] = useState(false);
  
  // Form states
  const [deviceForm, setDeviceForm] = useState<Partial<IoTDevice>>({});
  const [commandForm, setCommandForm] = useState({
    command_type: 'reboot',
    command_data: {},
  });
  const [configForm, setConfigForm] = useState<any>({});

  useEffect(() => {
    loadDevices();
    loadFirmwareUpdates();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      loadDeviceCommands(selectedDevice.id);
    }
  }, [selectedDevice]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const response = await enhancedApi.get('/devices', {
        params: { include_stats: true }
      });
      setDevices(response.data.data);
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDeviceCommands = async (deviceId: string) => {
    try {
      const response = await enhancedApi.get(`/devices/${deviceId}/commands`, {
        params: { limit: 50 }
      });
      setCommands(response.data.data);
    } catch (error) {
      console.error('Failed to load device commands:', error);
    }
  };

  const loadFirmwareUpdates = async () => {
    try {
      const response = await enhancedApi.get('/firmware/updates');
      setFirmwareUpdates(response.data.data);
    } catch (error) {
      console.error('Failed to load firmware updates:', error);
    }
  };

  const handleDeviceAction = async (action: string, deviceId: string, data?: any) => {
    try {
      switch (action) {
        case 'reboot':
          await enhancedApi.post(`/devices/${deviceId}/commands`, {
            command_type: 'reboot',
            command_data: {}
          });
          break;
        case 'update_config':
          await enhancedApi.put(`/devices/${deviceId}/configuration`, data);
          break;
        case 'firmware_update':
          await enhancedApi.post(`/devices/${deviceId}/firmware/update`, data);
          break;
        case 'delete':
          await enhancedApi.delete(`/devices/${deviceId}`);
          break;
      }
      
      await loadDevices();
      if (selectedDevice?.id === deviceId) {
        await loadDeviceCommands(deviceId);
      }
    } catch (error) {
      console.error(`Failed to ${action} device:`, error);
    }
  };

  const handleSendCommand = async () => {
    if (!selectedDevice) return;

    try {
      await enhancedApi.post(`/devices/${selectedDevice.id}/commands`, commandForm);
      setCommandDialogOpen(false);
      setCommandForm({ command_type: 'reboot', command_data: {} });
      await loadDeviceCommands(selectedDevice.id);
    } catch (error) {
      console.error('Failed to send command:', error);
    }
  };

  const handleUpdateConfiguration = async () => {
    if (!selectedDevice) return;

    try {
      await enhancedApi.put(`/devices/${selectedDevice.id}/configuration`, configForm);
      setConfigDialogOpen(false);
      await loadDevices();
    } catch (error) {
      console.error('Failed to update configuration:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Wifi color="success" />;
      case 'offline':
        return <WifiOff color="error" />;
      case 'maintenance':
        return <Settings color="warning" />;
      case 'error':
        return <BugReport color="error" />;
      default:
        return <WifiOff color="disabled" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'success';
      case 'offline':
        return 'error';
      case 'maintenance':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getBatteryIcon = (level?: number) => {
    if (!level) return <Battery90 color="disabled" />;
    if (level < 20) return <BatteryAlert color="error" />;
    return <Battery90 color="success" />;
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const DeviceOverview = () => (
    <Grid container spacing={3}>
      {devices.map((device) => (
        <Grid item xs={12} sm={6} md={4} key={device.id}>
          <Card
            sx={{
              cursor: 'pointer',
              border: selectedDevice?.id === device.id ? `2px solid ${theme.palette.primary.main}` : 'none',
              '&:hover': {
                elevation: 4,
              },
            }}
            onClick={() => setSelectedDevice(device)}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" noWrap>
                  {device.name}
                </Typography>
                {getStatusIcon(device.status)}
              </Box>

              <Box mb={2}>
                <Chip
                  label={device.status}
                  color={getStatusColor(device.status) as any}
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Chip
                  label={device.type.replace('_', ' ')}
                  variant="outlined"
                  size="small"
                />
              </Box>

              <Typography variant="body2" color="textSecondary" gutterBottom>
                {device.location}
              </Typography>

              <Box display="flex" alignItems="center" gap={2} mb={1}>
                {device.battery_level && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    {getBatteryIcon(device.battery_level)}
                    <Typography variant="caption">
                      {device.battery_level}%
                    </Typography>
                  </Box>
                )}
                
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Wifi fontSize="small" />
                  <Typography variant="caption">
                    {device.signal_strength}%
                  </Typography>
                </Box>

                {device.temperature && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Thermostat fontSize="small" />
                    <Typography variant="caption">
                      {device.temperature}°C
                    </Typography>
                  </Box>
                )}
              </Box>

              <Typography variant="caption" color="textSecondary">
                {t('devices.lastSeen')}: {format(new Date(device.last_seen), 'dd/MM HH:mm')}
              </Typography>

              {device.alerts.length > 0 && (
                <Box mt={1}>
                  <Chip
                    label={`${device.alerts.length} ${t('devices.alerts')}`}
                    color="warning"
                    size="small"
                  />
                </Box>
              )}

              <Box mt={2} display="flex" gap={1}>
                <Tooltip title={t('devices.reboot')}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeviceAction('reboot', device.id);
                    }}
                  >
                    <PowerSettingsNew />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title={t('devices.configure')}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDevice(device);
                      setConfigForm(device.configuration);
                      setConfigDialogOpen(true);
                    }}
                  >
                    <Settings />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title={t('devices.update')}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDevice(device);
                      setFirmwareDialogOpen(true);
                    }}
                  >
                    <Update />
                  </IconButton>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const DeviceDetails = () => {
    if (!selectedDevice) {
      return (
        <Box textAlign="center" py={4}>
          <Typography color="textSecondary">
            {t('devices.selectDevice')}
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('devices.deviceInfo')}
              </Typography>
              
              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">
                  {t('devices.deviceId')}
                </Typography>
                <Typography variant="body1">
                  {selectedDevice.device_id}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">
                  {t('devices.firmwareVersion')}
                </Typography>
                <Typography variant="body1">
                  {selectedDevice.firmware_version}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">
                  {t('devices.hardwareVersion')}
                </Typography>
                <Typography variant="body1">
                  {selectedDevice.hardware_version}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">
                  {t('devices.macAddress')}
                </Typography>
                <Typography variant="body1">
                  {selectedDevice.mac_address}
                </Typography>
              </Box>

              {selectedDevice.ip_address && (
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary">
                    {t('devices.ipAddress')}
                  </Typography>
                  <Typography variant="body1">
                    {selectedDevice.ip_address}
                  </Typography>
                </Box>
              )}

              <Box mb={2}>
                <Typography variant="body2" color="textSecondary">
                  {t('devices.uptime')}
                </Typography>
                <Typography variant="body1">
                  {formatUptime(selectedDevice.uptime)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('devices.systemStats')}
              </Typography>

              {selectedDevice.memory_usage && (
                <Box mb={2}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">
                      {t('devices.memoryUsage')}
                    </Typography>
                    <Typography variant="body2">
                      {selectedDevice.memory_usage}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={selectedDevice.memory_usage}
                    color={selectedDevice.memory_usage > 80 ? 'error' : 'primary'}
                  />
                </Box>
              )}

              {selectedDevice.storage_usage && (
                <Box mb={2}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">
                      {t('devices.storageUsage')}
                    </Typography>
                    <Typography variant="body2">
                      {selectedDevice.storage_usage}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={selectedDevice.storage_usage}
                    color={selectedDevice.storage_usage > 90 ? 'error' : 'primary'}
                  />
                </Box>
              )}

              <Box mb={2}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">
                    {t('devices.signalStrength')}
                  </Typography>
                  <Typography variant="body2">
                    {selectedDevice.signal_strength}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={selectedDevice.signal_strength}
                  color={selectedDevice.signal_strength < 30 ? 'error' : 'success'}
                />
              </Box>

              {selectedDevice.battery_level && (
                <Box mb={2}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">
                      {t('devices.batteryLevel')}
                    </Typography>
                    <Typography variant="body2">
                      {selectedDevice.battery_level}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={selectedDevice.battery_level}
                    color={selectedDevice.battery_level < 20 ? 'error' : 'success'}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6">
                  {t('devices.recentCommands')}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Code />}
                  onClick={() => setCommandDialogOpen(true)}
                >
                  {t('devices.sendCommand')}
                </Button>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('devices.command')}</TableCell>
                      <TableCell>{t('devices.status')}</TableCell>
                      <TableCell>{t('devices.sentAt')}</TableCell>
                      <TableCell>{t('devices.completedAt')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {commands.slice(0, 10).map((command) => (
                      <TableRow key={command.id}>
                        <TableCell>{command.command_type}</TableCell>
                        <TableCell>
                          <Chip
                            label={command.status}
                            color={command.status === 'completed' ? 'success' : 
                                   command.status === 'failed' ? 'error' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {format(new Date(command.created_at), 'dd/MM HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          {command.completed_at ? 
                            format(new Date(command.completed_at), 'dd/MM HH:mm:ss') : 
                            '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          {t('devices.management')}
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadDevices}
            disabled={loading}
          >
            {t('common.refresh')}
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setDeviceDialogOpen(true)}
          >
            {t('devices.addDevice')}
          </Button>
        </Box>
      </Box>

      <Box mb={3}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label={t('devices.overview')} />
          <Tab label={t('devices.details')} />
          <Tab label={t('devices.firmware')} />
        </Tabs>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {activeTab === 0 && <DeviceOverview />}
          {activeTab === 1 && <DeviceDetails />}
          {activeTab === 2 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('devices.firmwareUpdates')}
                </Typography>
                {/* Firmware updates content */}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Command Dialog */}
      <Dialog open={commandDialogOpen} onClose={() => setCommandDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('devices.sendCommand')}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>{t('devices.commandType')}</InputLabel>
            <Select
              value={commandForm.command_type}
              onChange={(e) => setCommandForm({ ...commandForm, command_type: e.target.value })}
            >
              <MenuItem value="reboot">{t('devices.reboot')}</MenuItem>
              <MenuItem value="calibrate">{t('devices.calibrate')}</MenuItem>
              <MenuItem value="reset">{t('devices.reset')}</MenuItem>
              <MenuItem value="update_config">{t('devices.updateConfig')}</MenuItem>
              <MenuItem value="custom">{t('devices.custom')}</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            margin="normal"
            label={t('devices.commandData')}
            multiline
            rows={4}
            value={JSON.stringify(commandForm.command_data, null, 2)}
            onChange={(e) => {
              try {
                setCommandForm({ ...commandForm, command_data: JSON.parse(e.target.value) });
              } catch (error) {
                // Invalid JSON, keep as string for now
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommandDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSendCommand} variant="contained">
            {t('devices.send')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t('devices.configuration')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label={t('devices.configuration')}
            multiline
            rows={10}
            value={JSON.stringify(configForm, null, 2)}
            onChange={(e) => {
              try {
                setConfigForm(JSON.parse(e.target.value));
              } catch (error) {
                // Invalid JSON, keep as string for now
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleUpdateConfiguration} variant="contained">
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeviceManagement;