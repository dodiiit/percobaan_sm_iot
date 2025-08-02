import React, { useState, useEffect } from 'react';
import Chip from '../ui/Chip';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  TextField,
  Divider,
  Avatar,
  Tab,
  Tabs,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Person,
  Edit,
  Save,
  Cancel,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../services/api';

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
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  created_at: string;
}

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await userAPI.getProfile();
      setProfile(response.data.data);
    } catch (err: any) {
      setError(t('error.generic'));
      console.error('Profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const profileFormik = useFormik({
    initialValues: {
      name: profile?.name || '',
      phone: profile?.phone || '',
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      name: Yup.string()
        .required(t('validation.required')),
      phone: Yup.string()
        .matches(/^\+?[0-9]{10,15}$/, t('validation.phoneNumber')),
    }),
    onSubmit: async (values) => {
      try {
        setError(null);
        setSuccess(null);

        await userAPI.updateProfile(values);
        await loadProfile();
        
        setSuccess(t('success.profileUpdate'));
        setIsEditing(false);
      } catch (err: any) {
        setError(err.response?.data?.message || t('error.generic'));
      }
    },
  });

  const passwordFormik = useFormik({
    initialValues: {
      current_password: '',
      password: '',
      password_confirmation: '',
    },
    validationSchema: Yup.object({
      current_password: Yup.string()
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
        setSuccess(null);

        await userAPI.changePassword(values);
        
        setSuccess(t('success.passwordChange'));
        passwordFormik.resetForm();
      } catch (err: any) {
        setError(err.response?.data?.message || t('error.generic'));
      }
    },
  });

  const handleCancelEdit = () => {
    setIsEditing(false);
    profileFormik.resetForm();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !profile) {
    return (
      <Box p={3}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={loadProfile}>
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
        {t('profile.title')}
      </Typography>

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
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: 36,
                }}
              >
                {profile ? getInitials(profile.name) : <Person />}
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {profile?.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {profile?.email}
              </Typography>
              <Chip
                label={profile?.role || 'customer'}
                color="primary"
                variant="outlined"
                sx={{ marginTop: '0.25rem' }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="profile tabs">
                <Tab label={t('profile.personalInfo')} />
                <Tab label={t('profile.changePassword')} />
              </Tabs>
            </Box>

            {/* Personal Info Tab */}
            <TabPanel value={tabValue} index={0}>
              <CardContent>
                {!isEditing ? (
                  <>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        {t('profile.personalInfo')}
                      </Typography>
                      <Button
                        startIcon={<Edit />}
                        onClick={() => setIsEditing(true)}
                      >
                        {t('profile.edit')}
                      </Button>
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" color="textSecondary">
                          {t('profile.name')}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={8}>
                        <Typography variant="body1">
                          {profile?.name}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" color="textSecondary">
                          {t('profile.email')}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={8}>
                        <Typography variant="body1">
                          {profile?.email}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" color="textSecondary">
                          {t('profile.phone')}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={8}>
                        <Typography variant="body1">
                          {profile?.phone || '-'}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" color="textSecondary">
                          {t('profile.role')}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={8}>
                        <Typography variant="body1">
                          {profile?.role}
                        </Typography>
                      </Grid>
                    </Grid>
                  </>
                ) : (
                  <form onSubmit={profileFormik.handleSubmit}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        {t('profile.editProfile')}
                      </Typography>
                      <Box>
                        <Button
                          startIcon={<Cancel />}
                          onClick={handleCancelEdit}
                          sx={{ mr: 1 }}
                        >
                          {t('common.cancel')}
                        </Button>
                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          startIcon={<Save />}
                          disabled={profileFormik.isSubmitting}
                        >
                          {t('common.save')}
                        </Button>
                      </Box>
                    </Box>
                    <Divider sx={{ mb: 3 }} />

                    <TextField
                      fullWidth
                      id="name"
                      name="name"
                      label={t('profile.name')}
                      value={profileFormik.values.name}
                      onChange={profileFormik.handleChange}
                      onBlur={profileFormik.handleBlur}
                      error={profileFormik.touched.name && Boolean(profileFormik.errors.name)}
                      helperText={profileFormik.touched.name && profileFormik.errors.name}
                      margin="normal"
                    />

                    <TextField
                      fullWidth
                      id="email"
                      name="email"
                      label={t('profile.email')}
                      value={profile?.email}
                      disabled
                      margin="normal"
                      helperText={t('profile.emailCannotBeChanged')}
                    />

                    <TextField
                      fullWidth
                      id="phone"
                      name="phone"
                      label={t('profile.phone')}
                      value={profileFormik.values.phone}
                      onChange={profileFormik.handleChange}
                      onBlur={profileFormik.handleBlur}
                      error={profileFormik.touched.phone && Boolean(profileFormik.errors.phone)}
                      helperText={profileFormik.touched.phone && profileFormik.errors.phone}
                      margin="normal"
                    />
                  </form>
                )}
              </CardContent>
            </TabPanel>

            {/* Change Password Tab */}
            <TabPanel value={tabValue} index={1}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('profile.changePassword')}
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <form onSubmit={passwordFormik.handleSubmit}>
                  <TextField
                    fullWidth
                    id="current_password"
                    name="current_password"
                    label={t('profile.currentPassword')}
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordFormik.values.current_password}
                    onChange={passwordFormik.handleChange}
                    onBlur={passwordFormik.handleBlur}
                    error={passwordFormik.touched.current_password && Boolean(passwordFormik.errors.current_password)}
                    helperText={passwordFormik.touched.current_password && passwordFormik.errors.current_password}
                    margin="normal"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle current password visibility"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            edge="end"
                          >
                            {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    id="password"
                    name="password"
                    label={t('profile.newPassword')}
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordFormik.values.password}
                    onChange={passwordFormik.handleChange}
                    onBlur={passwordFormik.handleBlur}
                    error={passwordFormik.touched.password && Boolean(passwordFormik.errors.password)}
                    helperText={passwordFormik.touched.password && passwordFormik.errors.password}
                    margin="normal"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle new password visibility"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            edge="end"
                          >
                            {showNewPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    id="password_confirmation"
                    name="password_confirmation"
                    label={t('profile.confirmNewPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordFormik.values.password_confirmation}
                    onChange={passwordFormik.handleChange}
                    onBlur={passwordFormik.handleBlur}
                    error={passwordFormik.touched.password_confirmation && Boolean(passwordFormik.errors.password_confirmation)}
                    helperText={passwordFormik.touched.password_confirmation && passwordFormik.errors.password_confirmation}
                    margin="normal"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle confirm password visibility"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Box sx={{ mt: 3 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={passwordFormik.isSubmitting}
                    >
                      {passwordFormik.isSubmitting ? (
                        <CircularProgress size={24} />
                      ) : (
                        t('profile.updatePassword')
                      )}
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </TabPanel>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;