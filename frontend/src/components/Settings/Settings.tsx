import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  useTheme,
} from '@mui/material';
import {
  DarkMode,
  LightMode,
  Translate,
  Notifications,
  Security,
  Devices,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { mode, toggleTheme } = useAppTheme();
  const { language, changeLanguage } = useLanguage();

  const handleLanguageChange = (event: SelectChangeEvent) => {
    changeLanguage(event.target.value);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('settings.title')}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('settings.appearance')}
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center">
                  {mode === 'light' ? (
                    <LightMode sx={{ mr: 2, color: 'primary.main' }} />
                  ) : (
                    <DarkMode sx={{ mr: 2, color: 'primary.main' }} />
                  )}
                  <Box>
                    <Typography variant="body1">
                      {t('settings.theme')}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {mode === 'light'
                        ? t('settings.lightMode')
                        : t('settings.darkMode')}
                    </Typography>
                  </Box>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={mode === 'dark'}
                      onChange={toggleTheme}
                      color="primary"
                    />
                  }
                  label=""
                />
              </Box>

              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center">
                  <Translate sx={{ mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body1">
                      {t('settings.language')}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {language === 'id' ? 'Bahasa Indonesia' : 'English'}
                    </Typography>
                  </Box>
                </Box>
                <FormControl sx={{ minWidth: 120 }}>
                  <Select
                    value={language}
                    onChange={handleLanguageChange}
                    size="small"
                  >
                    <MenuItem value="id">Bahasa Indonesia</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('settings.notifications')}
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center">
                  <Notifications sx={{ mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body1">
                      {t('settings.pushNotifications')}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {t('settings.pushNotificationsDesc')}
                    </Typography>
                  </Box>
                </Box>
                <FormControlLabel
                  control={<Switch defaultChecked color="primary" />}
                  label=""
                />
              </Box>

              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center">
                  <Notifications sx={{ mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body1">
                      {t('settings.emailNotifications')}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {t('settings.emailNotificationsDesc')}
                    </Typography>
                  </Box>
                </Box>
                <FormControlLabel
                  control={<Switch defaultChecked color="primary" />}
                  label=""
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('settings.security')}
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Box display="flex" alignItems="center">
                  <Security sx={{ mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body1">
                      {t('settings.twoFactorAuth')}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {t('settings.twoFactorAuthDesc')}
                    </Typography>
                  </Box>
                </Box>
                <Button variant="outlined" size="small">
                  {t('settings.enable')}
                </Button>
              </Box>

              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Box display="flex" alignItems="center">
                  <Devices sx={{ mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="body1">
                      {t('settings.connectedDevices')}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {t('settings.connectedDevicesDesc')}
                    </Typography>
                  </Box>
                </Box>
                <Button variant="outlined" size="small">
                  {t('settings.manage')}
                </Button>
              </Box>

              <Box
                sx={{
                  p: 2,
                  mt: 2,
                  borderRadius: 1,
                  bgcolor: theme.palette.error.main + '10',
                  border: `1px solid ${theme.palette.error.main}33`,
                }}
              >
                <Typography variant="subtitle2" color="error" gutterBottom>
                  {t('settings.dangerZone')}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  {t('settings.deleteAccountDesc')}
                </Typography>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  sx={{ mt: 1 }}
                >
                  {t('settings.deleteAccount')}
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('settings.about')}
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Typography variant="body2" paragraph>
                {t('settings.aboutDesc')}
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 2,
                }}
              >
                <Typography variant="body2" color="textSecondary">
                  {t('settings.version')}: 1.0.0
                </Typography>
                <Button variant="text" size="small">
                  {t('settings.checkUpdates')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;