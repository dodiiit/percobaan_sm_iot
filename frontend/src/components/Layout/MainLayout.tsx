import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
  useMediaQuery,
  useTheme as useMuiTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  WaterDrop as WaterDropIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Translate as TranslateIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

const drawerWidth = 240;

const MainLayout: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const { language, changeLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [anchorElLang, setAnchorElLang] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleOpenLangMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElLang(event.currentTarget);
  };

  const handleCloseLangMenu = () => {
    setAnchorElLang(null);
  };

  const handleLogout = async () => {
    handleCloseUserMenu();
    await logout();
    navigate('/login');
  };

  const handleLanguageChange = (lng: string) => {
    changeLanguage(lng);
    handleCloseLangMenu();
  };

  const menuItems = [
    { text: t('dashboard.title'), icon: <DashboardIcon />, path: '/dashboard' },
    { text: t('meters.title'), icon: <WaterDropIcon />, path: '/meters' },
    { text: t('payments.title'), icon: <PaymentIcon />, path: '/payments' },
    { text: t('profile.title'), icon: <PersonIcon />, path: '/profile' },
    { text: t('settings.title'), icon: <SettingsIcon />, path: '/settings' },
  ];

  const drawer = (
    <div>
      <Toolbar sx={{ justifyContent: 'center', py: 1 }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          {t('app.name')}
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) {
                  setMobileOpen(false);
                }
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? 'primary.main' : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
        }}
        elevation={1}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find((item) => item.path === location.pathname)?.text || t('app.name')}
          </Typography>

          {/* Theme Toggle */}
          <Tooltip title={mode === 'light' ? t('settings.darkMode') : t('settings.lightMode')}>
            <IconButton onClick={toggleTheme} color="inherit">
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>

          {/* Language Menu */}
          <Tooltip title={t('settings.language')}>
            <IconButton onClick={handleOpenLangMenu} color="inherit">
              <TranslateIcon />
            </IconButton>
          </Tooltip>
          <Menu
            sx={{ mt: '45px' }}
            id="language-menu"
            anchorEl={anchorElLang}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorElLang)}
            onClose={handleCloseLangMenu}
          >
            <MenuItem
              onClick={() => handleLanguageChange('id')}
              selected={language === 'id'}
            >
              <Typography textAlign="center">Bahasa Indonesia</Typography>
            </MenuItem>
            <MenuItem
              onClick={() => handleLanguageChange('en')}
              selected={language === 'en'}
            >
              <Typography textAlign="center">English</Typography>
            </MenuItem>
          </Menu>

          {/* Notifications */}
          <Tooltip title={t('notifications.title')}>
            <IconButton color="inherit">
              <NotificationsIcon />
            </IconButton>
          </Tooltip>

          {/* User Menu */}
          <Box sx={{ flexGrow: 0, ml: 1 }}>
            <Tooltip title={user?.name || ''}>
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar alt={user?.name} src="/static/images/avatar/1.jpg" />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem onClick={() => { navigate('/profile'); handleCloseUserMenu(); }}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                <Typography textAlign="center">{t('profile.title')}</Typography>
              </MenuItem>
              <MenuItem onClick={() => { navigate('/settings'); handleCloseUserMenu(); }}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <Typography textAlign="center">{t('settings.title')}</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <Typography textAlign="center">{t('auth.logout')}</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;