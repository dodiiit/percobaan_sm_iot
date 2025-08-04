import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  Link,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

const Register: React.FC = () => {
  const { t } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      role: 'customer', // Default role
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .required(t('validation.required')),
      email: Yup.string()
        .email(t('validation.email'))
        .required(t('validation.required')),
      password: Yup.string()
        .min(8, t('validation.passwordLength'))
        .required(t('validation.required')),
      password_confirmation: Yup.string()
        .oneOf([Yup.ref('password')], t('validation.passwordMatch'))
        .required(t('validation.required')),
    }),
    onSubmit: async (values) => {
      try {
        setError(null);
        await register(values);
        navigate('/login', { 
          state: { 
            message: t('success.register'),
            severity: 'success'
          } 
        });
      } catch (err: any) {
        setError(err.response?.data?.message || t('error.register'));
      }
    },
  });

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <Box>
      <Typography variant="h5" component="h1" gutterBottom align="center">
        {t('auth.register')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          id="name"
          name="name"
          label={t('auth.name')}
          value={formik.values.name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.name && Boolean(formik.errors.name)}
          helperText={formik.touched.name && formik.errors.name}
          margin="normal"
        />

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

        <TextField
          fullWidth
          id="password"
          name="password"
          label={t('auth.password')}
          type={showPassword ? 'text' : 'password'}
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.password && Boolean(formik.errors.password)}
          helperText={formik.touched.password && formik.errors.password}
          margin="normal"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <TextField
          fullWidth
          id="password_confirmation"
          name="password_confirmation"
          label={t('auth.confirmPassword')}
          type={showConfirmPassword ? 'text' : 'password'}
          value={formik.values.password_confirmation}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.password_confirmation && Boolean(formik.errors.password_confirmation)}
          helperText={formik.touched.password_confirmation && formik.errors.password_confirmation}
          margin="normal"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle confirm password visibility"
                  onClick={handleClickShowConfirmPassword}
                  edge="end"
                >
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
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
          {formik.isSubmitting ? '...' : t('auth.register')}
        </Button>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link component={RouterLink} to="/login" color="primary">
              {t('auth.login')}
            </Link>
          </Typography>
        </Box>
      </form>
    </Box>
  );
};

export default Register;