import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
  const { forgotPassword } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email(t('validation.email'))
        .required(t('validation.required')),
    }),
    onSubmit: async (values) => {
      try {
        setError(null);
        setSuccess(null);
        await forgotPassword(values.email);
        setSuccess(t('success.passwordResetSent'));
        formik.resetForm();
      } catch (err: any) {
        setError(err.response?.data?.message || t('error.generic'));
      }
    },
  });

  return (
    <Box>
      <Typography variant="h5" component="h1" gutterBottom align="center">
        {t('auth.forgotPassword')}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }} align="center">
        {t('auth.forgotPasswordInstructions')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          id="email"
          name="email"
          label={t('auth.email')}
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.email && Boolean(formik.errors.email)}
          helperText={formik.touched.email && formik.errors.email}
          margin="normal"
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          size="large"
          sx={{ mt: 3, mb: 2 }}
          disabled={formik.isSubmitting}
        >
          {formik.isSubmitting ? '...' : t('auth.sendResetLink')}
        </Button>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2">
            <Link component={RouterLink} to="/login" color="primary">
              {t('auth.backToLogin')}
            </Link>
          </Typography>
        </Box>
      </form>
    </Box>
  );
};

export default ForgotPassword;