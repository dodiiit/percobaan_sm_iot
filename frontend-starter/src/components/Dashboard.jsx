import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  AccountBalance,
  WaterDrop,
  Payment,
  TrendingUp,
} from '@mui/icons-material';
import { meterAPI, paymentAPI } from '../services/api';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    meters: [],
    totalBalance: 0,
    monthlyConsumption: 0,
    recentPayments: [],
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
        meters.map(async (meter) => {
          try {
            const balanceResponse = await meterAPI.getBalance(meter.id);
            return {
              ...meter,
              balance: balanceResponse.data.data.balance,
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
        (sum, meter) => sum + (meter.monthly_consumption || 0),
        0
      );

      setDashboardData({
        meters: metersWithBalance,
        totalBalance,
        monthlyConsumption,
        recentPayments,
      });
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount);
  };

  const getStatusColor = (status) => {
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
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Dashboard
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
                    Total Balance
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
                    Monthly Usage
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
                    Active Meters
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
                    Recent Payments
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
                Your Meters
              </Typography>
              {dashboardData.meters.length === 0 ? (
                <Typography color="textSecondary">
                  No meters found. Contact your administrator to add meters to your account.
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
                              color={getStatusColor(meter.status)}
                              size="small"
                            />
                          </Box>
                          <Typography color="textSecondary" gutterBottom>
                            {meter.location}
                          </Typography>
                          <Typography variant="h6" color="primary">
                            Balance: {formatCurrency(meter.balance || 0)}
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{ mt: 1 }}
                            onClick={() => {
                              // Navigate to meter details or top-up
                              console.log('Navigate to meter:', meter.id);
                            }}
                          >
                            Manage
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
                Recent Payments
              </Typography>
              {dashboardData.recentPayments.length === 0 ? (
                <Typography color="textSecondary">
                  No recent payments found.
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
                      borderBottom="1px solid #eee"
                    >
                      <Box>
                        <Typography variant="body2">
                          {payment.description || 'Payment'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {new Date(payment.created_at).toLocaleDateString()}
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