import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  useTheme,
} from '@mui/material';
import {
  AccountBalance,
  WaterDrop,
  Payment,
  TrendingUp,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { meterAPI, paymentAPI } from '../../services/api';

interface Meter {
  id: string;
  meter_id: string;
  status: string;
  location: string;
  balance: number;
  monthly_consumption?: number;
}

interface PaymentRecord {
  id: string;
  amount: number;
  status: string;
  description: string;
  created_at: string;
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState({
    meters: [] as Meter[],
    totalBalance: 0,
    monthlyConsumption: 0,
    recentPayments: [] as PaymentRecord[],
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load user's meters
      const metersResponse = await meterAPI.getMeters();
      const meters = metersResponse.data.data;

      // Load balance for each meter
      const metersWithBalance = await Promise.all(
        meters.map(async (meter: Meter) => {
          try {
            const balanceResponse = await meterAPI.getBalance(meter.id);
            return {
              ...meter,
              balance: balanceResponse.data.data.current_balance,
            };
          } catch (err) {
            return {
              ...meter,
              balance: 0,
            };
          }
        })
      );

      // Calculate total balance
      const totalBalance = metersWithBalance.reduce(
        (sum, meter) => sum + (meter.balance || 0),
        0
      );

      // Load recent payments
      const paymentsResponse = await paymentAPI.getPayments({ limit: 5 });
      const recentPayments = paymentsResponse.data.data;

      // Calculate monthly consumption (mock data for now)
      const monthlyConsumption = meters.reduce(
        (sum: number, meter: { monthly_consumption?: number }) => sum + (meter.monthly_consumption || 0),
        0
      );

      setDashboardData({
        meters: metersWithBalance,
        totalBalance,
        monthlyConsumption,
        recentPayments,
      });
    } catch (err: any) {
      setError(t('error.generic'));
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
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
        return 'success';
      case 'inactive':
        return 'error';
      case 'maintenance':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={loadDashboardData}>
            {t('common.retry')}
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('dashboard.title')}
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AccountBalance color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    {t('dashboard.totalBalance')}
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(dashboardData.totalBalance)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <WaterDrop color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    {t('dashboard.monthlyUsage')}
                  </Typography>
                  <Typography variant="h5">
                    {dashboardData.monthlyConsumption.toFixed(1)} L
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Payment color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    {t('dashboard.activeMeters')}
                  </Typography>
                  <Typography variant="h5">
                    {dashboardData.meters.filter(m => m.status === 'active').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    {t('dashboard.recentPayments')}
                  </Typography>
                  <Typography variant="h5">
                    {dashboardData.recentPayments.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Meters Overview */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('dashboard.yourMeters')}
              </Typography>
              {dashboardData.meters.length === 0 ? (
                <Typography color="textSecondary">
                  {t('dashboard.noMeters')}
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {dashboardData.meters.map((meter) => (
                    <Grid item xs={12} sm={6} key={meter.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {meter.meter_id}
                            </Typography>
                            <Chip
                              label={meter.status}
                              color={getStatusColor(meter.status) as any}
                              size="small"
                            />
                          </Box>
                          <Typography color="textSecondary" gutterBottom>
                            {meter.location}
                          </Typography>
                          <Typography variant="h6" color="primary">
                            {t('meters.balance')}: {formatCurrency(meter.balance || 0)}
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{ mt: 1 }}
                            onClick={() => navigate(`/meters/${meter.id}`)}
                          >
                            {t('dashboard.manage')}
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('dashboard.recentPayments')}
              </Typography>
              {dashboardData.recentPayments.length === 0 ? (
                <Typography color="textSecondary">
                  {t('dashboard.noPayments')}
                </Typography>
              ) : (
                <Box>
                  {dashboardData.recentPayments.map((payment) => (
                    <Box
                      key={payment.id}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      py={1}
                      borderBottom={`1px solid ${theme.palette.divider}`}
                    >
                      <Box>
                        <Typography variant="body2">
                          {payment.description || t('payments.payment')}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {format(new Date(payment.created_at), 'dd MMM yyyy')}
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(payment.amount)}
                        </Typography>
                        <Chip
                          label={payment.status}
                          color={payment.status === 'completed' ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
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

export default Dashboard;