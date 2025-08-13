import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  useTheme,
  Paper,
  Divider,
  Badge,
} from '@mui/material';
import {
  WaterDrop,
  Speed,
  Thermostat,
  Battery90,
  SignalWifi4Bar,
  Warning,
  CheckCircle,
  Error,
  Refresh,
  PlayArrow,
  Pause,
  Settings,
  Notifications,
  Timeline,
  DeviceHub,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { format } from 'date-fns';
// Import service instance default, tanpa destructure
import enhancedRealtimeService from '../../services/enhancedRealtimeService';
import enhancedMeterService from '../../services/enhancedMeterService';
import { enhancedApi } from '../../services/enhancedApi';

// Registrasi komponen Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

// Interface status meter
interface MeterStatus {
  id: string;
  meter_id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  lastUpdate: Date;
  realtimeData?: MeterRealtimeData;
  alerts: string[];
}

// Interface data sistem
interface SystemStats {
  totalMeters: number;
  onlineMeters: number;
  offlineMeters: number;
  alertCount: number;
  avgFlowRate: number;
  totalConsumption: number;
}

// Import tipe data dari service (tidak destructure, gunakan yang sudah di-export)
import type { MeterRealtimeData, NotificationData } from '../../services/enhancedRealtimeService';

const RealtimeDashboard: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  // State utama dashboard
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [meters, setMeters] = useState<MeterStatus[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalMeters: 0,
    onlineMeters: 0,
    offlineMeters: 0,
    alertCount: 0,
    avgFlowRate: 0,
    totalConsumption: 0,
  });
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [selectedMeter, setSelectedMeter] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>({});
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');

  // Ref untuk data realtime
  const realtimeDataRef = useRef<Map<string, MeterRealtimeData[]>>(new Map());
  const subscriptionsRef = useRef<string[]>([]);
  const mountedRef = useRef(true);

  // Effect pertama: inisialisasi dan cleanup
  useEffect(() => {
    mountedRef.current = true;
    loadInitialData();
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, []);

  // Effect untuk realtime
  useEffect(() => {
    if (isRealTimeEnabled && meters.length > 0) {
      startRealTimeUpdates();
    } else {
      stopRealTimeUpdates();
    }
  }, [isRealTimeEnabled, meters]);

  // Fungsi untuk load data awal
  const loadInitialData = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      setLoading(true);
      setError(null);

      // Ambil data meter
      const metersResponse = await enhancedMeterService.getMeters({
        include_realtime: true,
        limit: 50
      });

      if (!mountedRef.current) return;

      const meterData: MeterStatus[] = metersResponse.data.data.map((meter: any) => ({
        id: meter.id,
        meter_id: meter.meter_id,
        name: meter.name || meter.meter_id,
        location: meter.location || 'Unknown',
        status: meter.status === 'active' ? 'online' : 'offline',
        lastUpdate: new Date(meter.updated_at),
        alerts: meter.alerts || [],
      }));

      setMeters(meterData);
      updateSystemStats(meterData);

      // Ambil notifikasi
      await loadNotifications();
    } catch (err: any) {
      console.error('Dashboard loading error:', err);
      if (mountedRef.current) {
        setError(t('error.loadingData'));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [t]);

  // Fungsi untuk load notifikasi
  const loadNotifications = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const response = await enhancedApi.get('/notifications');
      if (mountedRef.current) {
        setNotifications(response.data.slice(0, 10)); // Hanya tampilkan 10 terakhir
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, []);

  // Fungsi untuk mulai realtime
  const startRealTimeUpdates = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      // Stop update yang lama
      await stopRealTimeUpdates();

      // Subscribe update meter
      const meterIds = meters.map(m => m.id);
      if (meterIds.length > 0) {
        const subscriptionIds = await enhancedRealtimeService.bulkSubscribeMeterUpdates(
          meterIds,
          handleMeterUpdate,
          handleMeterError
        );
        subscriptionsRef.current = subscriptionIds;
      }

      // Subscribe notifikasi
      const notificationSubscription = await enhancedRealtimeService.subscribeNotifications(
        handleNotificationUpdate,
        (error: any) => {
          console.error('Notification subscription error:', error);
          if (mountedRef.current) {
            setError(t('dashboard.notificationError'));
          }
        }
      );
      subscriptionsRef.current.push(notificationSubscription);

      if (mountedRef.current) {
        setConnectionStatus('connected');
      }
    } catch (err) {
      console.error('Failed to start real-time updates:', err);
      if (mountedRef.current) {
        setConnectionStatus('error');
        setError(t('dashboard.connectionError'));
      }
    }
  }, [meters, t]);

  // Fungsi stop realtime
  const stopRealTimeUpdates = useCallback(async () => {
    try {
      for (const subscriptionId of subscriptionsRef.current) {
        await enhancedRealtimeService.unsubscribe(subscriptionId);
      }
      subscriptionsRef.current = [];
      if (mountedRef.current) {
        setConnectionStatus('disconnected');
      }
    } catch (err) {
      console.error('Failed to stop real-time updates:', err);
    }
  }, []);

  // Handler update meter dari realtime
  const handleMeterUpdate = useCallback((meterId: string, data: MeterRealtimeData) => {
    if (!mountedRef.current) return;
    setMeters(prevMeters => {
      const updatedMeters = prevMeters.map(meter => {
        if (meter.id === meterId) {
          return {
            ...meter,
            status: 'online' as const,
            lastUpdate: new Date(),
            realtimeData: data,
            alerts: data.alerts || [],
          };
        }
        return meter;
      });
      updateSystemStats(updatedMeters);
      updateChartData(meterId, data);
      return updatedMeters;
    });
  }, []);

  // Handler error meter dari realtime
  const handleMeterError = useCallback((meterId: string, error: any) => {
    if (!mountedRef.current) return;
    setMeters(prevMeters => 
      prevMeters.map(meter => {
        if (meter.id === meterId) {
          return {
            ...meter,
            status: 'error' as const,
            lastUpdate: new Date(),
          };
        }
        return meter;
      })
    );
  }, []);

  // Handler notifikasi dari realtime
  const handleNotificationUpdate = useCallback((data: NotificationData) => {
    if (!mountedRef.current) return;
    setNotifications(prev => [data, ...prev.slice(0, 9)]);
  }, []);

  // Update statistik sistem
  const updateSystemStats = useCallback((meterData: MeterStatus[]) => {
    if (!mountedRef.current) return;
    const stats: SystemStats = {
      totalMeters: meterData.length,
      onlineMeters: meterData.filter(m => m.status === 'online').length,
      offlineMeters: meterData.filter(m => m.status === 'offline' || m.status === 'error').length,
      alertCount: meterData.reduce((sum, m) => sum + m.alerts.length, 0),
      avgFlowRate: meterData.length > 0 ? 
        meterData.reduce((sum, m) => sum + (m.realtimeData?.flow_rate || 0), 0) / meterData.length : 0,
      totalConsumption: meterData.reduce((sum, m) => sum + (m.realtimeData?.current_reading || 0), 0),
    };
    setSystemStats(stats);
  }, []);

  // Update data chart
  const updateChartData = useCallback((meterId: string, data: MeterRealtimeData) => {
    if (!mountedRef.current) return;
    const currentData = realtimeDataRef.current.get(meterId) || [];
    const newData = [...currentData, data].slice(-20); // Simpan maksimal 20 data terakhir
    realtimeDataRef.current.set(meterId, newData);

    if (selectedMeter === meterId) {
      updateSelectedMeterChart(newData);
    }
  }, [selectedMeter]);

  // Update chart meter yang dipilih
  const updateSelectedMeterChart = useCallback((data: MeterRealtimeData[]) => {
    if (!mountedRef.current) return;
    const labels = data.map(d => format(new Date(d.timestamp), 'HH:mm:ss'));
    setChartData({
      labels,
      datasets: [
        {
          label: t('dashboard.flowRate'),
          data: data.map(d => d.flow_rate),
          borderColor: theme.palette.primary.main,
          backgroundColor: theme.palette.primary.light,
          tension: 0.4,
        },
        {
          label: t('dashboard.pressure'),
          data: data.map(d => d.pressure),
          borderColor: theme.palette.secondary.main,
          backgroundColor: theme.palette.secondary.light,
          tension: 0.4,
        },
      ],
    });
  }, [t, theme]);

  // Cleanup realtime
  const cleanup = useCallback(() => {
    stopRealTimeUpdates();
  }, [stopRealTimeUpdates]);

  // Handler refresh
  const handleRefresh = useCallback(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handler toggle realtime
  const toggleRealTime = useCallback(() => {
    setIsRealTimeEnabled(!isRealTimeEnabled);
  }, [isRealTimeEnabled]);

  // Helper icon status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle color="success" />;
      case 'offline':
        return <Error color="error" />;
      case 'maintenance':
        return <Warning color="warning" />;
      case 'error':
        return <Error color="error" />;
      default:
        return <DeviceHub color="disabled" />;
    }
  };

  // Helper warna status
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

  // Helper format value dengan satuan
  const formatValue = (value: number, unit: string) => {
    return `${value.toFixed(2)} ${unit}`;
  };

  // Render loading
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Render error
  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={handleRefresh}>
            {t('common.retry')}
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  // Render UI utama dashboard
  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          {t('dashboard.realtimeMonitoring')}
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <FormControlLabel
            control={
              <Switch
                checked={isRealTimeEnabled}
                onChange={toggleRealTime}
                color="primary"
              />
            }
            label={t('dashboard.realTimeUpdates')}
          />
          <Chip
            icon={connectionStatus === 'connected' ? <CheckCircle /> : <Error />}
            label={t(`dashboard.connection.${connectionStatus}`)}
            color={connectionStatus === 'connected' ? 'success' : 'error'}
            variant="outlined"
          />
          <IconButton onClick={handleRefresh} disabled={loading}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* System Overview */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    {t('dashboard.totalMeters')}
                  </Typography>
                  <Typography variant="h4">
                    {systemStats.totalMeters}
                  </Typography>
                </Box>
                <DeviceHub color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    {t('dashboard.onlineMeters')}
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {systemStats.onlineMeters}
                  </Typography>
                </Box>
                <CheckCircle color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    {t('dashboard.alerts')}
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {systemStats.alertCount}
                  </Typography>
                </Box>
                <Badge badgeContent={systemStats.alertCount} color="error">
                  <Warning color="warning" sx={{ fontSize: 40 }} />
                </Badge>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    {t('dashboard.avgFlowRate')}
                  </Typography>
                  <Typography variant="h4">
                    {formatValue(systemStats.avgFlowRate, 'L/min')}
                  </Typography>
                </Box>
                <Speed color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Meters List */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('dashboard.meterStatus')}
              </Typography>
              <Grid container spacing={2}>
                {meters.map((meter) => (
                  <Grid item xs={12} sm={6} md={4} key={meter.id}>
                    <Paper
                      elevation={selectedMeter === meter.id ? 4 : 1}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        border: selectedMeter === meter.id ? `2px solid ${theme.palette.primary.main}` : 'none',
                        '&:hover': {
                          elevation: 3,
                        },
                      }}
                      onClick={() => setSelectedMeter(meter.id)}
                    >
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {meter.name}
                        </Typography>
                        {getStatusIcon(meter.status)}
                      </Box>
                      
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {meter.location}
                      </Typography>
                      
                      <Chip
                        label={meter.status}
                        color={getStatusColor(meter.status) as any}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                      
                      {meter.realtimeData && (
                        <Box mt={1}>
                          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <WaterDrop fontSize="small" />
                            <Typography variant="caption">
                              {formatValue(meter.realtimeData.flow_rate, 'L/min')}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <Speed fontSize="small" />
                            <Typography variant="caption">
                              {formatValue(meter.realtimeData.pressure, 'bar')}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Battery90 fontSize="small" />
                            <Typography variant="caption">
                              {meter.realtimeData.battery_level}%
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      
                      {meter.alerts.length > 0 && (
                        <Box mt={1}>
                          <Chip
                            label={`${meter.alerts.length} ${t('dashboard.alerts')}`}
                            color="warning"
                            size="small"
                          />
                        </Box>
                      )}
                      
                      <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                        {t('dashboard.lastUpdate')}: {format(meter.lastUpdate, 'HH:mm:ss')}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* Real-time Chart */}
          {selectedMeter && chartData.labels && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('dashboard.realtimeChart')}
                </Typography>
                <Box height={200}>
                  <Line
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                      },
                      plugins: {
                        legend: {
                          position: 'top' as const,
                        },
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Notifications */}
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6">
                  {t('dashboard.notifications')}
                </Typography>
                <Badge badgeContent={notifications.filter(n => !n.read).length} color="error">
                  <Notifications />
                </Badge>
              </Box>
              
              {notifications.length === 0 ? (
                <Typography color="textSecondary">
                  {t('dashboard.noNotifications')}
                </Typography>
              ) : (
                <Box>
                  {notifications.slice(0, 5).map((notification, index) => (
                    <Box key={notification.id}>
                      <Box py={1}>
                        <Box display="flex" alignItems="flex-start" gap={1}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: notification.read ? 'transparent' : theme.palette.primary.main,
                              mt: 1,
                            }}
                          />
                          <Box flex={1}>
                            <Typography variant="body2" fontWeight={notification.read ? 'normal' : 'bold'}>
                              {notification.title}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {notification.message}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" display="block">
                              {format(new Date(notification.created_at), 'HH:mm')}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      {index < notifications.length - 1 && <Divider />}
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RealtimeDashboard;
