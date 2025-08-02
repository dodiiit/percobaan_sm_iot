import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  Tabs,
  Tab,
} from '@mui/material';
import {
  WaterDrop,
  History,
  Payments,
  Settings,
  TrendingUp,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { meterAPI } from '../../services/api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface MeterData {
  id: string;
  meter_id: string;
  customer_id: string;
  property_id: string;
  installation_date: string;
  meter_type: string;
  meter_model: string;
  meter_serial: string;
  firmware_version: string;
  hardware_version: string;
  location_description: string;
  latitude: number;
  longitude: number;
  status: string;
}

interface MeterBalance {
  meter_id: string;
  current_balance: number;
  last_updated: string;
  status: string;
}

interface MeterStatus {
  meter_id: string;
  status: string;
  last_reading: number;
  last_reading_at: string;
  last_credit: number;
  last_credit_at: string;
  latest_data: {
    reading: number;
    flow_rate: number;
    battery_level: number;
    signal_strength: number;
    temperature: number;
    pressure: number;
    timestamp: string;
  };
  alerts: Array<{
    type: string;
    severity: string;
    message: string;
    value: number;
  }>;
}

interface ConsumptionData {
  date: string;
  start_reading: number;
  end_reading: number;
  consumption: number;
  reading_count: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`meter-tabpanel-${index}`}
      aria-labelledby={`meter-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const MeterDetails: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meter, setMeter] = useState<MeterData | null>(null);
  const [balance, setBalance] = useState<MeterBalance | null>(null);
  const [status, setStatus] = useState<MeterStatus | null>(null);
  const [consumption, setConsumption] = useState<ConsumptionData[]>([]);
  const [consumptionChart, setConsumptionChart] = useState<ChartData<'line'> | null>(null);

  useEffect(() => {
    if (id) {
      loadMeterData();
    }
  }, [id]);

  const loadMeterData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);

      // Load meter details
      const meterResponse = await meterAPI.getMeter(id);
      setMeter(meterResponse.data.data);

      // Load meter balance
      const balanceResponse = await meterAPI.getBalance(id);
      setBalance(balanceResponse.data.data);

      // Load meter status
      const statusResponse = await meterAPI.getStatus(id);
      setStatus(statusResponse.data.data);

      // Load consumption data
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      
      const consumptionResponse = await meterAPI.getConsumption(id, {
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      });
      
      const consumptionData = consumptionResponse.data.data.consumption;
      setConsumption(consumptionData);

      // Prepare chart data
      if (consumptionData && consumptionData.length > 0) {
        const chartData: ChartData<'line'> = {
          labels: consumptionData.map((item) => format(new Date(item.date), 'dd MMM')),
          datasets: [
            {
              label: t('meters.consumption'),
              data: consumptionData.map((item) => item.consumption),
              borderColor: theme.palette.primary.main,
              backgroundColor: theme.palette.primary.main + '33',
              fill: true,
              tension: 0.4,
            },
          ],
        };
        setConsumptionChart(chartData);
      }
    } catch (err: any) {
      setError(t('error.generic'));
      console.error('Meter details error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'connected':
        return 'success';
      case 'inactive':
      case 'disconnected':
        return 'error';
      case 'maintenance':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return theme.palette.error.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'info':
        return theme.palette.info.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !meter || !balance || !status) {
    return (
      <Box p={3}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={loadMeterData}>
            {t('common.retry')}
          </Button>
        }>
          {error || t('error.meterNotFound')}
        </Alert>
        <Button
          variant="outlined"
          onClick={() => navigate('/meters')}
          sx={{ mt: 2 }}
        >
          {t('common.back')}
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          {t('meters.details')}
        </Typography>
        <Button
          variant="outlined"
          onClick={() => navigate('/meters')}
        >
          {t('common.back')}
        </Button>
      </Box>

      {/* Meter Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box display="flex" alignItems="center" mb={2}>
                <WaterDrop color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {meter.meter_id}
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <Chip
                      label={status.status}
                      color={getStatusColor(status.status) as any}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="body2" color="textSecondary">
                      {meter.meter_type} - {meter.meter_model}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {t('meters.location')}: {meter.location_description}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {t('meters.serialNumber')}: {meter.meter_serial}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {t('meters.installedOn')}: {format(new Date(meter.installation_date), 'dd MMM yyyy')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: theme.palette.primary.main + '10',
                  border: `1px solid ${theme.palette.primary.main}33`,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  {t('meters.currentBalance')}
                </Typography>
                <Typography variant="h3" color="primary" fontWeight="bold">
                  {formatCurrency(balance.current_balance)}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {t('meters.lastUpdated')}: {format(new Date(balance.last_updated), 'dd MMM yyyy HH:mm')}
                </Typography>
                <Box mt={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => navigate(`/meters/${id}/topup`)}
                  >
                    {t('meters.topUp')}
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Alerts */}
      {status.alerts && status.alerts.length > 0 && (
        <Card sx={{ mb: 3, bgcolor: theme.palette.warning.main + '10' }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <Warning color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6">
                {t('meters.alerts')}
              </Typography>
            </Box>
            <Grid container spacing={2}>
              {status.alerts.map((alert, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                      border: `1px solid ${getAlertSeverityColor(alert.severity)}`,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ color: getAlertSeverityColor(alert.severity) }}
                    >
                      {alert.type.replace('_', ' ').toUpperCase()}
                    </Typography>
                    <Typography variant="body2">
                      {alert.message}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="meter tabs">
          <Tab icon={<TrendingUp />} label={t('meters.consumption')} />
          <Tab icon={<History />} label={t('meters.history')} />
          <Tab icon={<Payments />} label={t('meters.payments')} />
          <Tab icon={<Settings />} label={t('meters.settings')} />
        </Tabs>
      </Box>

      {/* Consumption Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('meters.monthlyConsumption')}
                </Typography>
                {consumptionChart ? (
                  <Box sx={{ height: 300 }}>
                    <Line
                      data={consumptionChart}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: t('meters.liters'),
                            },
                          },
                        },
                      }}
                    />
                  </Box>
                ) : (
                  <Typography color="textSecondary">
                    {t('meters.noConsumptionData')}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('meters.currentStatus')}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    {t('meters.lastReading')}
                  </Typography>
                  <Typography variant="h5">
                    {status.last_reading.toFixed(1)} L
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {format(new Date(status.last_reading_at), 'dd MMM yyyy HH:mm')}
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  {t('meters.deviceStatus')}
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      {t('meters.flowRate')}
                    </Typography>
                    <Typography variant="body1">
                      {status.latest_data.flow_rate.toFixed(1)} L/min
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      {t('meters.pressure')}
                    </Typography>
                    <Typography variant="body1">
                      {status.latest_data.pressure.toFixed(1)} bar
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      {t('meters.battery')}
                    </Typography>
                    <Typography variant="body1">
                      {status.latest_data.battery_level}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      {t('meters.signal')}
                    </Typography>
                    <Typography variant="body1">
                      {status.latest_data.signal_strength} dBm
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* History Tab */}
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('meters.consumptionHistory')}
            </Typography>
            {consumption.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('meters.date')}</TableCell>
                      <TableCell align="right">{t('meters.startReading')}</TableCell>
                      <TableCell align="right">{t('meters.endReading')}</TableCell>
                      <TableCell align="right">{t('meters.consumption')}</TableCell>
                      <TableCell align="right">{t('meters.readingCount')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {consumption.map((row) => (
                      <TableRow key={row.date}>
                        <TableCell component="th" scope="row">
                          {format(new Date(row.date), 'dd MMM yyyy')}
                        </TableCell>
                        <TableCell align="right">{row.start_reading.toFixed(1)} L</TableCell>
                        <TableCell align="right">{row.end_reading.toFixed(1)} L</TableCell>
                        <TableCell align="right">{row.consumption.toFixed(1)} L</TableCell>
                        <TableCell align="right">{row.reading_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="textSecondary">
                {t('meters.noConsumptionData')}
              </Typography>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Payments Tab */}
      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('meters.paymentHistory')}
            </Typography>
            <Typography color="textSecondary">
              {t('meters.noPaymentData')}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={() => navigate(`/meters/${id}/topup`)}
            >
              {t('meters.topUp')}
            </Button>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Settings Tab */}
      <TabPanel value={tabValue} index={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t('meters.deviceInformation')}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  {t('meters.meterId')}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {meter.meter_id}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  {t('meters.serialNumber')}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {meter.meter_serial}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  {t('meters.model')}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {meter.meter_model}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  {t('meters.type')}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {meter.meter_type}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  {t('meters.firmwareVersion')}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {meter.firmware_version}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  {t('meters.hardwareVersion')}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {meter.hardware_version}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  {t('meters.installationDate')}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {format(new Date(meter.installation_date), 'dd MMM yyyy')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  {t('meters.location')}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {meter.location_description}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
};

export default MeterDetails;