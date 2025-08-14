import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Paper,
  useTheme,
  Switch,
  FormControlLabel,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Timeline,
  TrendingUp,
  TrendingDown,
  ShowChart,
  BarChart,
  PieChart,
  Refresh,
  Download,
  FilterList,
  DateRange,
  WaterDrop,
  Speed,
  Thermostat,
  ElectricBolt,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { format } from 'date-fns';
// Import service instance
import { enhancedApi } from '../../services/enhancedApi';
import enhancedRealtimeService from '../../services/enhancedRealtimeService';

// Registrasi komponen Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

// Tipe data analytics, timeseries, dan device
interface AnalyticsData {
  consumption: {
    current: number;
    previous: number;
    trend: 'up' | 'down' | 'stable';
    percentage: number;
  };
  flowRate: {
    average: number;
    peak: number;
    minimum: number;
    current: number;
  };
  pressure: {
    average: number;
    peak: number;
    minimum: number;
    current: number;
  };
  temperature: {
    average: number;
    peak: number;
    minimum: number;
    current: number;
  };
  efficiency: {
    score: number;
    trend: 'up' | 'down' | 'stable';
    factors: string[];
  };
  alerts: {
    critical: number;
    warning: number;
    info: number;
  };
}

interface TimeSeriesData {
  timestamp: string;
  consumption: number;
  flow_rate: number;
  pressure: number;
  temperature: number;
  efficiency: number;
}

interface DeviceAnalytics {
  device_id: string;
  device_name: string;
  status: 'online' | 'offline' | 'maintenance';
  uptime: number;
  data_points: number;
  last_reading: string;
  performance_score: number;
}

const RealtimeAnalytics: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  // State utama untuk analytics
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [deviceAnalytics, setDeviceAnalytics] = useState<DeviceAnalytics[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedMetric, setSelectedMetric] = useState('consumption');
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
  
  // Ref untuk interval polling dan subscription realtime
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  // Effect utama untuk load data dan realtime
  useEffect(() => {
    mountedRef.current = true;
    loadAnalyticsData();
    return () => {
      mountedRef.current = false;
      stopRealTimeUpdates();
    };
  }, []);

  // Effect untuk realtime enable/disable
  useEffect(() => {
    if (isRealTimeEnabled) {
      startRealTimeUpdates();
    } else {
      stopRealTimeUpdates();
    }
  }, [isRealTimeEnabled]);

  // Effect jika range waktu berubah
  useEffect(() => {
    if (mountedRef.current) {
      loadAnalyticsData();
    }
  }, [selectedTimeRange]);

  // Fungsi load analytics summary, timeseries, dan device
  const loadAnalyticsData = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      setLoading(true);
      setError(null);
      // Load 3 endpoint sekaligus
      const [analyticsResponse, timeSeriesResponse, deviceResponse] = await Promise.allSettled([
        enhancedApi.get('/analytics/summary', {
          params: { time_range: selectedTimeRange }
        }),
        enhancedApi.get('/analytics/timeseries', {
          params: { 
            time_range: selectedTimeRange,
            metric: selectedMetric,
            interval: getInterval(selectedTimeRange)
          }
        }),
        enhancedApi.get('/analytics/devices', {
          params: { time_range: selectedTimeRange }
        })
      ]);

      if (!mountedRef.current) return;

      if (analyticsResponse.status === 'fulfilled') {
        setAnalyticsData(analyticsResponse.value.data.data);
      }
      if (timeSeriesResponse.status === 'fulfilled') {
        setTimeSeriesData(timeSeriesResponse.value.data.data);
      }
      if (deviceResponse.status === 'fulfilled') {
        setDeviceAnalytics(deviceResponse.value.data.data);
      }

      // Jika ada request gagal
      const failedRequests = [analyticsResponse, timeSeriesResponse, deviceResponse]
        .filter(result => result.status === 'rejected');
      if (failedRequests.length > 0) {
        console.error('Beberapa request analytics gagal:', failedRequests);
        setError(t('analytics.partialLoadError'));
      }
    } catch (error) {
      console.error('Gagal load analytics data:', error);
      if (mountedRef.current) {
        setError(t('analytics.loadError'));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [selectedTimeRange, selectedMetric, t]);

  // Fungsi untuk memulai realtime analytics
  const startRealTimeUpdates = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      stopRealTimeUpdates();
      // Subscribe ke realtime analytics
      const subscriptionId = await enhancedRealtimeService.subscribeUpdates(
        { type: 'analytics' },
        handleRealTimeUpdate,
        (error: any) => {
          console.error('Error realtime analytics:', error);
          if (mountedRef.current) {
            setError(t('analytics.realtimeError'));
          }
        }
      );
      subscriptionRef.current = subscriptionId;
      // Polling timeseries setiap 30 detik
      intervalRef.current = setInterval(() => {
        if (mountedRef.current) {
          loadTimeSeriesData();
        }
      }, 30000);
    } catch (error) {
      console.error('Gagal memulai realtime updates:', error);
      if (mountedRef.current) {
        setError(t('analytics.realtimeConnectionError'));
      }
    }
  }, [t]);

  // Fungsi untuk stop realtime updates dan polling
  const stopRealTimeUpdates = useCallback(() => {
    if (subscriptionRef.current) {
      try {
        enhancedRealtimeService.unsubscribe(subscriptionRef.current);
      } catch (error) {
        console.error('Error unsubscribe realtime:', error);
      }
      subscriptionRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Handler data dari realtime event
  const handleRealTimeUpdate = useCallback((data: any) => {
    if (!mountedRef.current) return;
    if (data.type === 'analytics_update' && data.analytics) {
      setAnalyticsData(prevData => prevData ? {
        ...prevData,
        ...data.analytics
      } : data.analytics);
    }
  }, []);

  // Fungsi untuk polling timeseries data
  const loadTimeSeriesData = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const response = await enhancedApi.get('/analytics/timeseries', {
        params: { 
          time_range: selectedTimeRange,
          metric: selectedMetric,
          interval: getInterval(selectedTimeRange)
        }
      });
      if (mountedRef.current) {
        setTimeSeriesData(response.data.data);
      }
    } catch (error) {
      console.error('Gagal load timeseries data:', error);
    }
  }, [selectedTimeRange, selectedMetric]);

  // Helper interval berdasarkan range waktu
  const getInterval = useCallback((timeRange: string) => {
    switch (timeRange) {
      case '1h':
        return '1m';
      case '6h':
        return '5m';
      case '24h':
        return '15m';
      case '7d':
        return '1h';
      case '30d':
        return '6h';
      default:
        return '15m';
    }
  }, []);

  // Helper format value beserta satuan
  const formatValue = (value: number, metric: string) => {
    switch (metric) {
      case 'consumption':
        return `${value.toFixed(2)} L`;
      case 'flow_rate':
        return `${value.toFixed(2)} L/min`;
      case 'pressure':
        return `${value.toFixed(2)} bar`;
      case 'temperature':
        return `${value.toFixed(1)}°C`;
      case 'efficiency':
        return `${value.toFixed(1)}%`;
      default:
        return value.toFixed(2);
    }
  };

  // Helper icon trend
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp color="success" />;
      case 'down':
        return <TrendingDown color="error" />;
      case 'stable':
        return <ShowChart color="info" />;
    }
  };

  // Chart data untuk time series
  const getChartData = useMemo(() => {
    if (!timeSeriesData.length) {
      return { labels: [], datasets: [] };
    }
    const labels = timeSeriesData.map(d => 
      format(new Date(d.timestamp), selectedTimeRange === '1h' ? 'HH:mm' : 'dd/MM HH:mm')
    );
    const datasets = [];
    if (selectedMetric === 'consumption') {
      datasets.push({
        label: t('analytics.consumption'),
        data: timeSeriesData.map(d => d.consumption),
        borderColor: theme.palette.primary.main,
        backgroundColor: chartType === 'area' ? 
          `${theme.palette.primary.main}20` : theme.palette.primary.main,
        fill: chartType === 'area',
        tension: 0.4,
      });
    } else if (selectedMetric === 'flow_rate') {
      datasets.push({
        label: t('analytics.flowRate'),
        data: timeSeriesData.map(d => d.flow_rate),
        borderColor: theme.palette.secondary.main,
        backgroundColor: chartType === 'area' ? 
          `${theme.palette.secondary.main}20` : theme.palette.secondary.main,
        fill: chartType === 'area',
        tension: 0.4,
      });
    } else if (selectedMetric === 'pressure') {
      datasets.push({
        label: t('analytics.pressure'),
        data: timeSeriesData.map(d => d.pressure),
        borderColor: theme.palette.warning.main,
        backgroundColor: chartType === 'area' ? 
          `${theme.palette.warning.main}20` : theme.palette.warning.main,
        fill: chartType === 'area',
        tension: 0.4,
      });
    } else if (selectedMetric === 'temperature') {
      datasets.push({
        label: t('analytics.temperature'),
        data: timeSeriesData.map(d => d.temperature),
        borderColor: theme.palette.error.main,
        backgroundColor: chartType === 'area' ? 
          `${theme.palette.error.main}20` : theme.palette.error.main,
        fill: chartType === 'area',
        tension: 0.4,
      });
    } else if (selectedMetric === 'all') {
      datasets.push(
        {
          label: t('analytics.consumption'),
          data: timeSeriesData.map(d => d.consumption),
          borderColor: theme.palette.primary.main,
          backgroundColor: `${theme.palette.primary.main}20`,
          yAxisID: 'y',
          tension: 0.4,
        },
        {
          label: t('analytics.flowRate'),
          data: timeSeriesData.map(d => d.flow_rate),
          borderColor: theme.palette.secondary.main,
          backgroundColor: `${theme.palette.secondary.main}20`,
          yAxisID: 'y1',
          tension: 0.4,
        }
      );
    }
    return { labels, datasets };
  }, [timeSeriesData, selectedMetric, chartType, theme, t, selectedTimeRange]);

  // Chart options
  const getChartOptions = useMemo(() => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top' as const,
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              return `${context.dataset.label}: ${formatValue(context.parsed.y, selectedMetric)}`;
            },
          },
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: t('analytics.time'),
          },
        },
        y: {
          type: 'linear' as const,
          display: true,
          position: 'left' as const,
          title: {
            display: true,
            text: t(`analytics.${selectedMetric}`),
          },
        },
      },
    };
    if (selectedMetric === 'all') {
      (baseOptions.scales as any).y1 = {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: t('analytics.flowRate'),
        },
        grid: {
          drawOnChartArea: false,
        },
      };
    }
    return baseOptions;
  }, [selectedMetric, t]);

  // Fungsi export data
  const exportData = useCallback(async () => {
    try {
      const response = await enhancedApi.get('/analytics/export', {
        params: { 
          time_range: selectedTimeRange,
          format: 'csv'
        },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics_${selectedTimeRange}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Gagal export data:', error);
      if (mountedRef.current) {
        setError(t('analytics.exportError'));
      }
    }
  }, [selectedTimeRange, t]);

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
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={loadAnalyticsData}>
              {t('common.retry')}
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  // Render UI utama analytics
  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          {t('analytics.realtimeAnalytics')}
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <FormControlLabel
            control={
              <Switch
                checked={isRealTimeEnabled}
                onChange={(e) => setIsRealTimeEnabled(e.target.checked)}
              />
            }
            label={t('analytics.realTimeUpdates')}
          />
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={exportData}
          >
            {t('analytics.export')}
          </Button>
          <IconButton onClick={loadAnalyticsData}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Controls filter */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>{t('analytics.timeRange')}</InputLabel>
          <Select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
          >
            <MenuItem value="1h">1 {t('analytics.hour')}</MenuItem>
            <MenuItem value="6h">6 {t('analytics.hours')}</MenuItem>
            <MenuItem value="24h">24 {t('analytics.hours')}</MenuItem>
            <MenuItem value="7d">7 {t('analytics.days')}</MenuItem>
            <MenuItem value="30d">30 {t('analytics.days')}</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>{t('analytics.metric')}</InputLabel>
          <Select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
          >
            <MenuItem value="consumption">{t('analytics.consumption')}</MenuItem>
            <MenuItem value="flow_rate">{t('analytics.flowRate')}</MenuItem>
            <MenuItem value="pressure">{t('analytics.pressure')}</MenuItem>
            <MenuItem value="temperature">{t('analytics.temperature')}</MenuItem>
            <MenuItem value="all">{t('analytics.all')}</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>{t('analytics.chartType')}</InputLabel>
          <Select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as any)}
          >
            <MenuItem value="line">{t('analytics.line')}</MenuItem>
            <MenuItem value="bar">{t('analytics.bar')}</MenuItem>
            <MenuItem value="area">{t('analytics.area')}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Ringkasan utama */}
      {analyticsData && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      {t('analytics.totalConsumption')}
                    </Typography>
                    <Typography variant="h5">
                      {formatValue(analyticsData.consumption.current, 'consumption')}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mt={1}>
                      {getTrendIcon(analyticsData.consumption.trend)}
                      <Typography 
                        variant="body2" 
                        color={analyticsData.consumption.trend === 'up' ? 'success.main' : 
                               analyticsData.consumption.trend === 'down' ? 'error.main' : 'info.main'}
                      >
                        {analyticsData.consumption.percentage.toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                  <WaterDrop color="primary" sx={{ fontSize: 40 }} />
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
                      {t('analytics.avgFlowRate')}
                    </Typography>
                    <Typography variant="h5">
                      {formatValue(analyticsData.flowRate.average, 'flow_rate')}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {t('analytics.peak')}: {formatValue(analyticsData.flowRate.peak, 'flow_rate')}
                    </Typography>
                  </Box>
                  <Speed color="secondary" sx={{ fontSize: 40 }} />
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
                      {t('analytics.avgPressure')}
                    </Typography>
                    <Typography variant="h5">
                      {formatValue(analyticsData.pressure.average, 'pressure')}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {t('analytics.current')}: {formatValue(analyticsData.pressure.current, 'pressure')}
                    </Typography>
                  </Box>
                  <ElectricBolt color="warning" sx={{ fontSize: 40 }} />
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
                      {t('analytics.efficiency')}
                    </Typography>
                    <Typography variant="h5">
                      {formatValue(analyticsData.efficiency.score, 'efficiency')}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mt={1}>
                      {getTrendIcon(analyticsData.efficiency.trend)}
                      <Typography variant="body2" color="textSecondary">
                        {t('analytics.systemHealth')}
                      </Typography>
                    </Box>
                  </Box>
                  <CheckCircle color="success" sx={{ fontSize: 40 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Main Chart */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('analytics.timeSeriesChart')}
              </Typography>
              <Box height={400}>
                {getChartData.labels.length > 0 ? (
                  chartType === 'line' || chartType === 'area' ? (
                    <Line data={getChartData} options={getChartOptions} />
                  ) : (
                    <Bar data={getChartData} options={getChartOptions} />
                  )
                ) : (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Typography color="textSecondary">
                      {t('analytics.noData')}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('analytics.alerts')}
              </Typography>
              {analyticsData && (
                <Box>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">{t('analytics.critical')}</Typography>
                    <Chip 
                      label={analyticsData.alerts.critical} 
                      color="error" 
                      size="small" 
                    />
                  </Box>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">{t('analytics.warning')}</Typography>
                    <Chip 
                      label={analyticsData.alerts.warning} 
                      color="warning" 
                      size="small" 
                    />
                  </Box>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2">{t('analytics.info')}</Typography>
                    <Chip 
                      label={analyticsData.alerts.info} 
                      color="info" 
                      size="small" 
                    />
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('analytics.devicePerformance')}
              </Typography>
              <Box maxHeight={300} overflow="auto">
                {deviceAnalytics.map((device) => (
                  <Box key={device.device_id} mb={2}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" fontWeight="bold">
                        {device.device_name}
                      </Typography>
                      <Chip
                        label={device.status}
                        color={device.status === 'online' ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography variant="caption" color="textSecondary">
                        {t('analytics.performance')}
                      </Typography>
                      <Typography variant="caption">
                        {device.performance_score.toFixed(1)}%
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="caption" color="textSecondary">
                        {t('analytics.dataPoints')}
                      </Typography>
                      <Typography variant="caption">
                        {device.data_points.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RealtimeAnalytics;
