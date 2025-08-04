import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Receipt as ReceiptIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { paymentAPI } from '../../services/api';

interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
  description: string;
  created_at: string;
  meter_id?: string;
  meter_name?: string;
}

const PaymentHistory: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadPayments();
  }, [page, rowsPerPage]);

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await paymentAPI.getPayments({
        limit: rowsPerPage,
        offset: page * rowsPerPage,
      });
      
      setPayments(response.data.data);
      setTotalCount(response.data.meta?.total || response.data.data.length);
    } catch (err: any) {
      setError(t('error.generic'));
      console.error('Payments error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    if (!searchTerm) {
      setFilteredPayments(payments);
      return;
    }

    const filtered = payments.filter(
      (payment) =>
        payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.meter_id && payment.meter_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (payment.meter_name && payment.meter_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    setFilteredPayments(filtered);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'midtrans':
        return 'Midtrans';
      case 'doku':
        return 'DOKU';
      case 'manual':
        return t('payments.manualTransfer');
      default:
        return method;
    }
  };

  if (loading && payments.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('payments.history')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} action={
          <Button color="inherit" size="small" onClick={loadPayments}>
            {t('common.retry')}
          </Button>
        }>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap">
            <TextField
              placeholder={t('payments.search')}
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ width: { xs: '100%', sm: '300px' }, mb: { xs: 2, sm: 0 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Box>
              <Tooltip title={t('common.refresh')}>
                <IconButton onClick={loadPayments} disabled={loading}>
                  {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
                </IconButton>
              </Tooltip>
              <Tooltip title={t('payments.filter')}>
                <IconButton>
                  <FilterIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('payments.date')}</TableCell>
              <TableCell>{t('payments.description')}</TableCell>
              <TableCell>{t('payments.method')}</TableCell>
              <TableCell align="right">{t('payments.amount')}</TableCell>
              <TableCell align="center">{t('payments.status')}</TableCell>
              <TableCell align="center">{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography color="textSecondary">
                    {searchTerm
                      ? t('payments.noPaymentsFound')
                      : t('payments.noPaymentsYet')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {format(new Date(payment.created_at), 'dd MMM yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {payment.description || t('payments.payment')}
                    </Typography>
                    {payment.meter_id && (
                      <Typography variant="caption" color="textSecondary">
                        {payment.meter_name || payment.meter_id}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{getMethodLabel(payment.method)}</TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold">
                      {formatCurrency(payment.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={payment.status}
                      color={getStatusColor(payment.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title={t('payments.viewDetails')}>
                      <IconButton size="small">
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {payment.status === 'completed' && (
                      <Tooltip title={t('payments.viewReceipt')}>
                        <IconButton size="small">
                          <ReceiptIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default PaymentHistory;