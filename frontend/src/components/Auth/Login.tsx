import React, { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
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

interface LocationState {
  from?: {
    pathname: string;
  };
}

const Login: React.FC = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const locationState = location.state as LocationState;
  const from = locationState?.from?.pathname || '/dashboard';

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email(t('validation.email'))
        .required(t('validation.required')),
      password: Yup.string()
        .required(t('validation.required')),
    }),
    onSubmit: async (values) => {
      try {
        setError(null);
        await login(values.email, values.password);
        navigate(from, { replace: true });
      } catch (err: any) {
        setError(err.response?.data?.message || t('error.login'));
      }
    },
  });

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box>
      <Typography variant="h5" component="h1" gutterBottom align="center">
        {t('auth.login')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
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

        <Box sx={{ mt: 1, textAlign: 'right' }}>
          <Link
            component={RouterLink}
            to="/forgot-password"
            variant="body2"
            color="primary"
          >
            {t('auth.forgotPassword')}
          </Link>
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          size="large"
          sx={{ mt: 3, mb: 2 }}
          disabled={formik.isSubmitting}
        >
          {formik.isSubmitting ? '...' : t('auth.login')}
        </Button>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2">
            {t('auth.dontHaveAccount')}{' '}
            <Link component={RouterLink} to="/register" color="primary">
              {t('auth.register')}
            </Link>
          </Typography>
        </Box>
      </form>
    </Box>
  );
};

export default Login;