import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { Line, Bar, Doughnut, Scatter } from 'react-chartjs-2';
import { format, subHours, subDays, startOfDay, endOfDay } from 'date-fns';
import { enhancedApi } from '../../services/enhancedApi';
import { enhancedRealtimeService } from '../../services/enhancedRealtimeService';

// Register Chart.js components
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
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [deviceAnalytics, setDeviceAnalytics] = useState<DeviceAnalytics[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedMetric, setSelectedMetric] = useState('consumption');
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
  
  // Real-time update interval
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef<string | null>(null);

  useEffect(() => {
    loadAnalyticsData();
    if (isRealTimeEnabled) {
      startRealTimeUpdates();
    }
    
    return () => {
      stopRealTimeUpdates();
    };
  }, [selectedTimeRange, isRealTimeEnabled]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Load analytics summary
      const analyticsResponse = await enhancedApi.get('/analytics/summary', {
        params: { time_range: selectedTimeRange }
      });
      setAnalyticsData(analyticsResponse.data.data);

      // Load time series data
      const timeSeriesResponse = await enhancedApi.get('/analytics/timeseries', {
        params: { 
          time_range: selectedTimeRange,
          metric: selectedMetric,
          interval: getInterval(selectedTimeRange)
        }
      });
      setTimeSeriesData(timeSeriesResponse.data.data);

      // Load device analytics
      const deviceResponse = await enhancedApi.get('/analytics/devices', {
        params: { time_range: selectedTimeRange }
      });
      setDeviceAnalytics(deviceResponse.data.data);

    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startRealTimeUpdates = async () => {
    try {
      // Subscribe to real-time analytics updates
      const subscriptionId = await enhancedRealtimeService.subscribeUpdates(
        { type: 'analytics' },
        handleRealTimeUpdate,
        (error) => console.error('Real-time analytics error:', error)
      );
      subscriptionRef.current = subscriptionId;

      // Set up periodic refresh for time series data
      intervalRef.current = setInterval(() => {
        loadTimeSeriesData();
      }, 30000); // Update every 30 seconds

    } catch (error) {
      console.error('Failed to start real-time updates:', error);
    }
  };

  const stopRealTimeUpdates = () => {
    if (subscriptionRef.current) {
      enhancedRealtimeService.unsubscribe(subscriptionRef.current);
      subscriptionRef.current = null;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleRealTimeUpdate = useCallback((data: any) => {
    if (data.type === 'analytics_update') {
      setAnalyticsData(prevData => ({
        ...prevData,
        ...data.analytics
      }));
    }
  }, []);

  const loadTimeSeriesData = async () => {
    try {
      const response = await enhancedApi.get('/analytics/timeseries', {
        params: { 
          time_range: selectedTimeRange,
          metric: selectedMetric,
          interval: getInterval(selectedTimeRange)
        }
      });
      setTimeSeriesData(response.data.data);
    } catch (error) {
      console.error('Failed to load time series data:', error);
    }
  };

  const getInterval = (timeRange: string) => {
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
  };

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

  const getChartData = () => {
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
    } else if (selectedMetric === 'all') {
      datasets.push(
        {
          label: t('analytics.consumption'),
          data: timeSeriesData.map(d => d.consumption),
          borderColor: theme.palette.primary.main,
          backgroundColor: `${theme.palette.primary.main}20`,
          yAxisID: 'y',
        },
        {
          label: t('analytics.flowRate'),
          data: timeSeriesData.map(d => d.flow_rate),
          borderColor: theme.palette.secondary.main,
          backgroundColor: `${theme.palette.secondary.main}20`,
          yAxisID: 'y1',
        }
      );
    }

    return { labels, datasets };
  };

  const getChartOptions = () => {
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
      baseOptions.scales.y1 = {
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
  };

  const exportData = async () => {
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
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

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

      {/* Controls */}
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

      {/* Summary Cards */}
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
                {chartType === 'line' || chartType === 'area' ? (
                  <Line data={getChartData()} options={getChartOptions()} />
                ) : (
                  <Bar data={getChartData()} options={getChartOptions()} />
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