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
  People as PeopleIcon,
  Home as HomeIcon,
  Assessment as AssessmentIcon,
  Business as BusinessIcon,
  BarChart as BarChartIcon,
  AdminPanelSettings as AdminIcon,
  MonetizationOn as TariffsIcon,
  Apartment as PropertiesIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSelector from '../common/LanguageSelector';

const drawerWidth = 240;

const MainLayout: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout, userRole, isCustomer, isClient, isSuperAdmin } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const { language, changeLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = async () => {
    handleCloseUserMenu();
    await logout();
    navigate('/login');
  };

  // Common menu items for all users
  const commonMenuItems = [
    { text: t('dashboard.title'), icon: <DashboardIcon />, path: '/dashboard' },
    { text: t('profile.title'), icon: <PersonIcon />, path: '/profile' },
    { text: t('settings.title'), icon: <SettingsIcon />, path: '/settings' },
  ];

  // Customer-specific menu items
  const customerMenuItems = [
    { text: t('meters.title'), icon: <WaterDropIcon />, path: '/meters' },
    { text: t('consumption.title'), icon: <BarChartIcon />, path: '/consumption' },
    { text: t('payments.title'), icon: <PaymentIcon />, path: '/payments' },
    { text: t('topup.title'), icon: <TariffsIcon />, path: '/topup' },
  ];

  // Client (Water Utility Company) menu items
  const clientMenuItems = [
    { text: t('customers.title'), icon: <PeopleIcon />, path: '/customers' },
    { text: t('meters.title'), icon: <WaterDropIcon />, path: '/meters' },
    { text: t('properties.title'), icon: <PropertiesIcon />, path: '/properties' },
    { text: t('analytics.title'), icon: <BarChartIcon />, path: '/analytics' },
    { text: t('payments.title'), icon: <PaymentIcon />, path: '/payments' },
    { text: t('reports.title'), icon: <AssessmentIcon />, path: '/reports' },
  ];

  // Superadmin menu items
  const superadminMenuItems = [
    { text: t('clients.title'), icon: <BusinessIcon />, path: '/clients' },
    { text: t('customers.title'), icon: <PeopleIcon />, path: '/customers' },
    { text: t('meters.title'), icon: <WaterDropIcon />, path: '/meters' },
    { text: t('properties.title'), icon: <PropertiesIcon />, path: '/properties' },
    { text: t('payments.title'), icon: <PaymentIcon />, path: '/payments' },
    { text: t('reports.title'), icon: <AssessmentIcon />, path: '/reports' },
    { text: t('tariffs.title'), icon: <TariffsIcon />, path: '/tariffs' },
    { text: t('system.title'), icon: <AdminIcon />, path: '/system' },
  ];

  // Determine which menu items to show based on user role
  let menuItems = [...commonMenuItems];
  
  if (isCustomer) {
    menuItems = [...menuItems, ...customerMenuItems];
  } else if (isClient) {
    menuItems = [...menuItems, ...clientMenuItems];
  } else if (isSuperAdmin) {
    menuItems = [...menuItems, ...superadminMenuItems];
  }

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

          {/* Language Selector */}
          <LanguageSelector variant="icon" />

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