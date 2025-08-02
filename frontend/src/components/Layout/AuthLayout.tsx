import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, Paper, Typography, useTheme, IconButton } from '@mui/material';
import { Brightness4 as DarkModeIcon, Brightness7 as LightModeIcon, Translate as TranslateIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

const AuthLayout: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { mode, toggleTheme } = useAppTheme();
  const { language, changeLanguage } = useLanguage();

  const toggleLanguage = () => {
    changeLanguage(language === 'id' ? 'en' : 'id');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        backgroundImage: `linear-gradient(to bottom right, ${theme.palette.primary.light}22, ${theme.palette.primary.main}33)`,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          gap: 1,
        }}
      >
        <IconButton onClick={toggleTheme} color="inherit">
          {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
        </IconButton>
        <IconButton onClick={toggleLanguage} color="inherit">
          <TranslateIcon />
        </IconButton>
      </Box>

      <Container
        maxWidth="sm"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          flexGrow: 1,
          py: 4,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 'bold',
              color: 'primary.main',
              mb: 1,
            }}
          >
            {t('app.name')}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {t('app.tagline')}
          </Typography>
        </Box>

        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2,
            boxShadow: theme.shadows[3],
          }}
        >
          <Outlet />
        </Paper>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            &copy; 2025 IndoWater System. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default AuthLayout;