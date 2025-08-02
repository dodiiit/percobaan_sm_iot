import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  TextField,
  Grid,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  InputAdornment,
  Paper,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { meterAPI, paymentAPI } from '../../services/api';

interface MeterData {
  id: string;
  meter_id: string;
  location_description: string;
  status: string;
}

interface MeterBalance {
  meter_id: string;
  current_balance: number;
  last_updated: string;
  status: string;
}

const MeterTopUp: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [meter, setMeter] = useState<MeterData | null>(null);
  const [balance, setBalance] = useState<MeterBalance | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const predefinedAmounts = [50000, 100000, 200000, 500000, 1000000];

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
    } catch (err: any) {
      setError(t('error.generic'));
      console.error('Meter details error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      amount: 100000,
      customAmount: '',
      paymentMethod: 'midtrans',
      description: '',
    },
    validationSchema: Yup.object({
      amount: Yup.number()
        .required(t('validation.required')),
      customAmount: Yup.string()
        .when('amount', {
          is: 0,
          then: (schema) => schema.required(t('validation.required'))
            .test(
              'is-number',
              t('validation.invalidAmount'),
              (value) => !isNaN(Number(value))
            )
            .test(
              'min-amount',
              t('validation.minAmount', { amount: '10,000' }),
              (value) => Number(value) >= 10000
            ),
        }),
      paymentMethod: Yup.string()
        .required(t('validation.required')),
      description: Yup.string(),
    }),
    onSubmit: async (values) => {
      if (!id) return;
      
      try {
        setSubmitting(true);
        setError(null);
        setSuccess(null);
        setPaymentUrl(null);

        const finalAmount = values.amount === 0 ? Number(values.customAmount) : values.amount;
        
        // Create payment
        const paymentResponse = await paymentAPI.createPayment({
          amount: finalAmount,
          method: values.paymentMethod,
          description: values.description || `Top up for meter ${meter?.meter_id}`,
          return_url: `${window.location.origin}/meters/${id}`,
        });

        const { payment_url } = paymentResponse.data.data;
        
        if (payment_url) {
          setPaymentUrl(payment_url);
        } else {
          // If no payment URL (e.g., for manual top-up), add credit directly
          await meterAPI.topup(id, finalAmount, values.description || `Manual top-up for meter ${meter?.meter_id}`);
          setSuccess(t('success.topUp'));
          
          // Reload meter data to show updated balance
          loadMeterData();
        }
      } catch (err: any) {
        setError(err.response?.data?.message || t('error.generic'));
        console.error('Top up error:', err);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount);
  };

  const handleAmountSelect = (amount: number) => {
    formik.setFieldValue('amount', amount);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !meter) {
    return (
      <Box p={3}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={loadMeterData}>
            {t('common.retry')}
          </Button>
        }>
          {error}
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

  if (paymentUrl) {
    return (
      <Box>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom align="center">
              {t('payments.redirecting')}
            </Typography>
            <Box display="flex" justifyContent="center" my={3}>
              <CircularProgress />
            </Box>
            <Typography align="center" gutterBottom>
              {t('payments.redirectingToGateway')}
            </Typography>
            <Box display="flex" justifyContent="center" mt={3}>
              <Button
                variant="contained"
                color="primary"
                href={paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('payments.openPaymentPage')}
              </Button>
            </Box>
          </CardContent>
        </Card>
        <Box display="flex" justifyContent="center" mt={2}>
          <Button variant="outlined" onClick={() => navigate(`/meters/${id}`)}>
            {t('common.cancel')}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          {t('meters.topUp')}
        </Typography>
        <Button
          variant="outlined"
          onClick={() => navigate(`/meters/${id}`)}
        >
          {t('common.back')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('meters.meterInformation')}
              </Typography>
              {meter && (
                <>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {meter.meter_id}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {meter.location_description}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="textSecondary">
                    {t('meters.currentBalance')}
                  </Typography>
                  <Typography variant="h5" color="primary" fontWeight="bold">
                    {balance ? formatCurrency(balance.current_balance) : '-'}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('meters.topUpDetails')}
              </Typography>
              <form onSubmit={formik.handleSubmit}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('payments.selectAmount')}
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {predefinedAmounts.map((amount) => (
                    <Grid item xs={6} sm={4} key={amount}>
                      <Paper
                        elevation={formik.values.amount === amount ? 3 : 1}
                        sx={{
                          p: 2,
                          textAlign: 'center',
                          cursor: 'pointer',
                          border: formik.values.amount === amount ? '2px solid' : '1px solid',
                          borderColor: formik.values.amount === amount ? 'primary.main' : 'divider',
                          bgcolor: formik.values.amount === amount ? 'primary.light + 10' : 'background.paper',
                        }}
                        onClick={() => handleAmountSelect(amount)}
                      >
                        <Typography variant="h6">
                          {formatCurrency(amount)}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                  <Grid item xs={6} sm={4}>
                    <Paper
                      elevation={formik.values.amount === 0 ? 3 : 1}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        cursor: 'pointer',
                        border: formik.values.amount === 0 ? '2px solid' : '1px solid',
                        borderColor: formik.values.amount === 0 ? 'primary.main' : 'divider',
                        bgcolor: formik.values.amount === 0 ? 'primary.light + 10' : 'background.paper',
                      }}
                      onClick={() => handleAmountSelect(0)}
                    >
                      <Typography variant="h6">
                        {t('payments.custom')}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {formik.values.amount === 0 && (
                  <TextField
                    fullWidth
                    id="customAmount"
                    name="customAmount"
                    label={t('payments.customAmount')}
                    value={formik.values.customAmount}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.customAmount && Boolean(formik.errors.customAmount)}
                    helperText={formik.touched.customAmount && formik.errors.customAmount}
                    margin="normal"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Rp</InputAdornment>,
                    }}
                  />
                )}

                <TextField
                  fullWidth
                  id="description"
                  name="description"
                  label={t('payments.description')}
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  margin="normal"
                  placeholder={t('payments.descriptionPlaceholder')}
                />

                <FormControl component="fieldset" sx={{ mt: 3 }}>
                  <FormLabel component="legend">{t('payments.paymentMethod')}</FormLabel>
                  <RadioGroup
                    name="paymentMethod"
                    value={formik.values.paymentMethod}
                    onChange={formik.handleChange}
                  >
                    <FormControlLabel
                      value="midtrans"
                      control={<Radio />}
                      label="Midtrans (Credit Card, Bank Transfer, E-Wallet)"
                    />
                    <FormControlLabel
                      value="doku"
                      control={<Radio />}
                      label="DOKU (Credit Card, Bank Transfer)"
                    />
                    <FormControlLabel
                      value="manual"
                      control={<Radio />}
                      label={t('payments.manualTransfer')}
                    />
                  </RadioGroup>
                </FormControl>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/meters/${id}`)}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={submitting || !formik.isValid}
                  >
                    {submitting ? (
                      <CircularProgress size={24} />
                    ) : (
                      t('payments.proceedToPayment')
                    )}
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MeterTopUp;