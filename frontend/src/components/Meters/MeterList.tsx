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
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  WaterDrop,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { meterAPI } from '../../services/api';

interface Meter {
  id: string;
  meter_id: string;
  customer_id: string;
  property_id: string;
  installation_date: string;
  meter_type: string;
  meter_model: string;
  meter_serial: string;
  location_description: string;
  status: string;
  balance?: number;
}

const MeterList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meters, setMeters] = useState<Meter[]>([]);
  const [filteredMeters, setFilteredMeters] = useState<Meter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadMeters();
  }, []);

  useEffect(() => {
    filterMeters();
  }, [meters, searchTerm, statusFilter]);

  const loadMeters = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await meterAPI.getMeters();
      const metersData = response.data.data;

      // Load balance for each meter
      const metersWithBalance = await Promise.all(
        metersData.map(async (meter: Meter) => {
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

      setMeters(metersWithBalance);
      setFilteredMeters(metersWithBalance);
    } catch (err: any) {
      setError(t('error.generic'));
      console.error('Meters error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterMeters = () => {
    let filtered = [...meters];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (meter) =>
          meter.meter_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          meter.location_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          meter.meter_serial.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((meter) => meter.status === statusFilter);
    }

    setFilteredMeters(filtered);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
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
          <Button color="inherit" size="small" onClick={loadMeters}>
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
        {t('meters.title')}
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder={t('meters.search')}
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel id="status-filter-label">
                  {t('meters.statusFilter')}
                </InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  label={t('meters.statusFilter')}
                  onChange={handleStatusFilterChange}
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterIcon />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="all">{t('meters.allStatuses')}</MenuItem>
                  <MenuItem value="active">{t('meters.active')}</MenuItem>
                  <MenuItem value="inactive">{t('meters.inactive')}</MenuItem>
                  <MenuItem value="maintenance">{t('meters.maintenance')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={loadMeters}
              >
                {t('common.refresh')}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Meters List */}
      {filteredMeters.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <WaterDrop sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3 }} />
              <Typography variant="h6" color="textSecondary" mt={2}>
                {t('meters.noMetersFound')}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {searchTerm || statusFilter !== 'all'
                  ? t('meters.tryDifferentFilters')
                  : t('meters.noMetersRegistered')}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredMeters.map((meter) => (
            <Grid item xs={12} sm={6} md={4} key={meter.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h6" fontWeight="bold">
                      {meter.meter_id}
                    </Typography>
                    <Chip
                      label={meter.status}
                      color={getStatusColor(meter.status) as any}
                      size="small"
                    />
                  </Box>
                  <Typography color="textSecondary" variant="body2" gutterBottom>
                    {meter.location_description}
                  </Typography>
                  <Typography color="textSecondary" variant="body2" gutterBottom>
                    {meter.meter_type} - {meter.meter_model}
                  </Typography>
                  <Divider sx={{ my: 1.5 }} />
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="textSecondary">
                      {t('meters.balance')}:
                    </Typography>
                    <Typography variant="h6" color="primary" fontWeight="bold">
                      {formatCurrency(meter.balance || 0)}
                    </Typography>
                  </Box>
                  <Box mt={2} display="flex" justifyContent="space-between">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/meters/${meter.id}`)}
                    >
                      {t('meters.details')}
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => navigate(`/meters/${meter.id}/topup`)}
                    >
                      {t('meters.topUp')}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default MeterList;