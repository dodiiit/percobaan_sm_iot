import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Switch,
  FormControlLabel,
  Slider,
  Alert,
  CircularProgress,
  LinearProgress,
  Tooltip,
  Paper,
  useTheme,
  Divider,
} from '@mui/material';
import {
  PowerSettingsNew,
  Lock,
  LockOpen,
  Schedule,
  Settings,
  History,
  Warning,
  CheckCircle,
  Error,
  Refresh,
  PlayArrow,
  Pause,
  Stop,
  Timer,
  WaterDrop,
  Speed,
  Thermostat,
  Battery90,
  Wifi,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format, addMinutes, addHours } from 'date-fns';
import { enhancedApi } from '../../services/enhancedApi';
import enhancedRealtimeService from '../../services/enhancedRealtimeService';

interface Valve {
  id: string;
  valve_id: string;
  name: string;
  location: string;
  status: 'open' | 'closed' | 'partially_open' | 'error' | 'maintenance';
  position: number; // 0-100 percentage
  flow_rate: number;
  pressure: number;
  temperature: number;
  battery_level?: number;
  signal_strength: number;
  last_command: string;
  last_update: string;
  is_automated: boolean;
  schedule_enabled: boolean;
  emergency_stop: boolean;
  alerts: string[];
  configuration: {
    max_flow_rate: number;
    min_pressure: number;
    max_pressure: number;
    auto_close_timeout: number;
    emergency_threshold: number;
  };
}

interface ValveCommand {
  id: string;
  valve_id: string;
  command_type: 'open' | 'close' | 'set_position' | 'emergency_stop' | 'schedule' | 'calibrate';
  command_data: any;
  status: 'pending' | 'sent' | 'acknowledged' | 'completed' | 'failed' | 'timeout';
  scheduled_at?: string;
  executed_at?: string;
  response?: any;
  error_message?: string;
  created_at: string;
}

interface ValveSchedule {
  id: string;
  valve_id: string;
  name: string;
  schedule_type: 'daily' | 'weekly' | 'interval' | 'one_time';
  action: 'open' | 'close' | 'set_position';
  action_data: any;
  start_time: string;
  end_time?: string;
  days_of_week?: number[];
  interval_minutes?: number;
  is_active: boolean;
  next_execution: string;
}

const ValveControl: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [valves, setValves] = useState<Valve[]>([]);
  const [selectedValve, setSelectedValve] = useState<Valve | null>(null);
  const [commands, setCommands] = useState<ValveCommand[]>([]);
  const [schedules, setSchedules] = useState<ValveSchedule[]>([]);
  
  // Dialog states
  const [commandDialogOpen, setCommandDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);
  
  // Form states
  const [commandForm, setCommandForm] = useState({
    command_type: 'open',
    position: 100,
    duration: 60,
    scheduled_at: '',
  });
  const [scheduleForm, setScheduleForm] = useState<Partial<ValveSchedule>>({
    schedule_type: 'daily',
    action: 'open',
    start_time: '08:00',
    end_time: '18:00',
    is_active: true,
  });

  // Real-time subscriptions
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    loadValves();
    startRealTimeUpdates();
    
    return () => {
      mountedRef.current = false;
      stopRealTimeUpdates();
    };
  }, []);

  useEffect(() => {
    if (selectedValve && mountedRef.current) {
      loadValveCommands(selectedValve.id);
      loadValveSchedules(selectedValve.id);
    }
  }, [selectedValve]);

  const loadValves = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await enhancedApi.get('/valves', {
        params: { include_realtime: true }
      });
      
      if (mountedRef.current) {
        setValves(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load valves:', error);
      if (mountedRef.current) {
        setError(t('valves.loadError'));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [t]);

  const loadValveCommands = useCallback(async (valveId: string) => {
    if (!mountedRef.current) return;
    
    try {
      const response = await enhancedApi.get(`/valves/${valveId}/commands`, {
        params: { limit: 20 }
      });
      
      if (mountedRef.current) {
        setCommands(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load valve commands:', error);
    }
  }, []);

  const loadValveSchedules = useCallback(async (valveId: string) => {
    if (!mountedRef.current) return;
    
    try {
      const response = await enhancedApi.get(`/valves/${valveId}/schedules`);
      
      if (mountedRef.current) {
        setSchedules(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load valve schedules:', error);
    }
  }, []);

  const startRealTimeUpdates = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      // Stop existing subscriptions first
      stopRealTimeUpdates();
      
      // Subscribe to valve updates
      const valveSubscription = await enhancedRealtimeService.subscribeUpdates(
        { type: 'valve_updates' },
        handleValveUpdate,
        (error: any) => {
          console.error('Valve subscription error:', error);
          if (mountedRef.current) {
            setError(t('valves.realtimeError'));
          }
        }
      );
      
      if (mountedRef.current) {
        setSubscriptions(prev => [...prev, valveSubscription]);
      }
    } catch (error) {
      console.error('Failed to start real-time updates:', error);
      if (mountedRef.current) {
        setError(t('valves.connectionError'));
      }
    }
  }, [t]);

  const stopRealTimeUpdates = useCallback(() => {
    subscriptions.forEach(id => {
      try {
        enhancedRealtimeService.unsubscribe(id);
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    });
    setSubscriptions([]);
  }, [subscriptions]);

  const handleValveUpdate = useCallback((data: any) => {
    if (!mountedRef.current) return;
    
    if (data.type === 'valve_status_update' && data.valve_id && data.data) {
      setValves(prev => prev.map(valve => 
        valve.id === data.valve_id ? { ...valve, ...data.data } : valve
      ));
      
      if (selectedValve?.id === data.valve_id) {
        setSelectedValve(prev => prev ? { ...prev, ...data.data } : null);
      }
    }
  }, [selectedValve]);

  const handleValveCommand = useCallback(async (valveId: string, command: any) => {
    if (!mountedRef.current) return;
    
    try {
      const response = await enhancedRealtimeService.sendMeterCommand(valveId, {
        type: 'valve_control',
        data: command
      });
      
      // Poll command status
      await enhancedRealtimeService.pollCommandStatus(response.data.command_id, {
        onUpdate: (status: string) => {
          console.log(`Command ${response.data.command_id} status: ${status}`);
        }
      });
      
      if (mountedRef.current) {
        await loadValveCommands(valveId);
        await loadValves();
      }
    } catch (error) {
      console.error('Failed to send valve command:', error);
      if (mountedRef.current) {
        setError(t('valves.commandError'));
      }
      throw error; // Re-throw for proper error handling
    }
  }, [loadValveCommands, loadValves, t]);

  const handleQuickAction = useCallback(async (valveId: string, action: 'open' | 'close' | 'emergency_stop') => {
    if (!mountedRef.current) return;
    
    try {
      const command = {
        command_type: action,
        command_data: action === 'emergency_stop' ? { immediate: true } : {}
      };
      
      await handleValveCommand(valveId, command);
    } catch (error) {
      // Error already handled in handleValveCommand
    }
  }, [handleValveCommand]);

  const handleScheduledCommand = async () => {
    if (!selectedValve) return;

    try {
      const command = {
        command_type: commandForm.command_type,
        command_data: {
          position: commandForm.position,
          duration: commandForm.duration,
        },
        scheduled_at: commandForm.scheduled_at || undefined,
      };

      await enhancedApi.post(`/valves/${selectedValve.id}/commands`, command);
      setCommandDialogOpen(false);
      await loadValveCommands(selectedValve.id);
    } catch (error) {
      console.error('Failed to schedule command:', error);
    }
  };

  const handleCreateSchedule = async () => {
    if (!selectedValve) return;

    try {
      await enhancedApi.post(`/valves/${selectedValve.id}/schedules`, scheduleForm);
      setScheduleDialogOpen(false);
      await loadValveSchedules(selectedValve.id);
    } catch (error) {
      console.error('Failed to create schedule:', error);
    }
  };

  const handleToggleSchedule = async (scheduleId: string, isActive: boolean) => {
    try {
      await enhancedApi.put(`/schedules/${scheduleId}`, { is_active: isActive });
      await loadValveSchedules(selectedValve!.id);
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <LockOpen color="success" />;
      case 'closed':
        return <Lock color="error" />;
      case 'partially_open':
        return <PlayArrow color="warning" />;
      case 'error':
        return <Error color="error" />;
      case 'maintenance':
        return <Settings color="warning" />;
      default:
        return <Lock color="disabled" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'success';
      case 'closed':
        return 'error';
      case 'partially_open':
        return 'warning';
      case 'error':
        return 'error';
      case 'maintenance':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={loadValves}>
              {t('common.retry')}
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          {t('valves.control')}
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadValves}
          >
            {t('common.refresh')}
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<Warning />}
            onClick={() => setEmergencyDialogOpen(true)}
          >
            {t('valves.emergencyStop')}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Valve Cards */}
        <Grid item xs={12} lg={8}>
          <Grid container spacing={2}>
            {valves.map((valve) => (
              <Grid item xs={12} sm={6} md={4} key={valve.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: selectedValve?.id === valve.id ? `2px solid ${theme.palette.primary.main}` : 'none',
                    '&:hover': {
                      elevation: 4,
                    },
                  }}
                  onClick={() => setSelectedValve(valve)}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <Typography variant="h6" noWrap>
                        {valve.name}
                      </Typography>
                      {getStatusIcon(valve.status)}
                    </Box>

                    <Box mb={2}>
                      <Chip
                        label={valve.status}
                        color={getStatusColor(valve.status) as any}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      {valve.is_automated && (
                        <Chip
                          label={t('valves.automated')}
                          variant="outlined"
                          size="small"
                        />
                      )}
                    </Box>

                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {valve.location}
                    </Typography>

                    {/* Position Indicator */}
                    <Box mb={2}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">
                          {t('valves.position')}
                        </Typography>
                        <Typography variant="body2">
                          {valve.position}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={valve.position}
                        color={valve.position > 80 ? 'success' : valve.position > 20 ? 'warning' : 'error'}
                      />
                    </Box>

                    {/* Real-time Data */}
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <WaterDrop fontSize="small" />
                        <Typography variant="caption">
                          {valve.flow_rate.toFixed(1)} L/min
                        </Typography>
                      </Box>
                      
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Speed fontSize="small" />
                        <Typography variant="caption">
                          {valve.pressure.toFixed(1)} bar
                        </Typography>
                      </Box>

                      {valve.battery_level && (
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Battery90 fontSize="small" />
                          <Typography variant="caption">
                            {valve.battery_level}%
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {valve.alerts.length > 0 && (
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        {valve.alerts.length} {t('valves.alerts')}
                      </Alert>
                    )}

                    {/* Quick Actions */}
                    <Box display="flex" gap={1}>
                      <Tooltip title={t('valves.open')}>
                        <IconButton
                          size="small"
                          color="success"
                          disabled={valve.status === 'open' || valve.emergency_stop}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickAction(valve.id, 'open');
                          }}
                        >
                          <LockOpen />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title={t('valves.close')}>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={valve.status === 'closed' || valve.emergency_stop}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickAction(valve.id, 'close');
                          }}
                        >
                          <Lock />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title={t('valves.emergencyStop')}>
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickAction(valve.id, 'emergency_stop');
                          }}
                        >
                          <Stop />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                      {t('valves.lastUpdate')}: {format(new Date(valve.last_update), 'HH:mm:ss')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Control Panel */}
        <Grid item xs={12} lg={4}>
          {selectedValve ? (
            <Box>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {selectedValve.name} - {t('valves.control')}
                  </Typography>
                  
                  <Box mb={3}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Schedule />}
                      onClick={() => setCommandDialogOpen(true)}
                      sx={{ mb: 1 }}
                    >
                      {t('valves.scheduleCommand')}
                    </Button>
                    
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Timer />}
                      onClick={() => setScheduleDialogOpen(true)}
                    >
                      {t('valves.createSchedule')}
                    </Button>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    {t('valves.automation')}
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedValve.is_automated}
                        onChange={(e) => {
                          // Handle automation toggle
                        }}
                      />
                    }
                    label={t('valves.enableAutomation')}
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={selectedValve.schedule_enabled}
                        onChange={(e) => {
                          // Handle schedule toggle
                        }}
                      />
                    }
                    label={t('valves.enableSchedule')}
                  />
                </CardContent>
              </Card>

              {/* Active Schedules */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {t('valves.activeSchedules')}
                  </Typography>
                  
                  {schedules.length === 0 ? (
                    <Typography color="textSecondary">
                      {t('valves.noSchedules')}
                    </Typography>
                  ) : (
                    schedules.map((schedule) => (
                      <Paper key={schedule.id} sx={{ p: 2, mb: 1 }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                          <Typography variant="subtitle2">
                            {schedule.name}
                          </Typography>
                          <Switch
                            checked={schedule.is_active}
                            onChange={(e) => handleToggleSchedule(schedule.id, e.target.checked)}
                          />
                        </Box>
                        
                        <Typography variant="body2" color="textSecondary">
                          {schedule.schedule_type} - {schedule.action}
                        </Typography>
                        
                        <Typography variant="caption" color="textSecondary">
                          {t('valves.nextExecution')}: {format(new Date(schedule.next_execution), 'dd/MM HH:mm')}
                        </Typography>
                      </Paper>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Recent Commands */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {t('valves.recentCommands')}
                  </Typography>
                  
                  <Box maxHeight={200} overflow="auto">
                    {commands.slice(0, 5).map((command) => (
                      <Box key={command.id} mb={1}>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Typography variant="body2">
                            {command.command_type}
                          </Typography>
                          <Chip
                            label={command.status}
                            color={command.status === 'completed' ? 'success' : 
                                   command.status === 'failed' ? 'error' : 'default'}
                            size="small"
                          />
                        </Box>
                        <Typography variant="caption" color="textSecondary">
                          {format(new Date(command.created_at), 'dd/MM HH:mm')}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ) : (
            <Card>
              <CardContent>
                <Typography color="textSecondary" textAlign="center">
                  {t('valves.selectValve')}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Command Dialog */}
      <Dialog open={commandDialogOpen} onClose={() => setCommandDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('valves.scheduleCommand')}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>{t('valves.commandType')}</InputLabel>
            <Select
              value={commandForm.command_type}
              onChange={(e) => setCommandForm({ ...commandForm, command_type: e.target.value })}
            >
              <MenuItem value="open">{t('valves.open')}</MenuItem>
              <MenuItem value="close">{t('valves.close')}</MenuItem>
              <MenuItem value="set_position">{t('valves.setPosition')}</MenuItem>
            </Select>
          </FormControl>

          {commandForm.command_type === 'set_position' && (
            <Box mt={2}>
              <Typography gutterBottom>
                {t('valves.position')}: {commandForm.position}%
              </Typography>
              <Slider
                value={commandForm.position}
                onChange={(_, value) => setCommandForm({ ...commandForm, position: value as number })}
                min={0}
                max={100}
                step={5}
                marks
                valueLabelDisplay="auto"
              />
            </Box>
          )}

          <TextField
            fullWidth
            margin="normal"
            label={t('valves.duration')}
            type="number"
            value={commandForm.duration}
            onChange={(e) => setCommandForm({ ...commandForm, duration: parseInt(e.target.value) })}
            InputProps={{
              endAdornment: t('common.minutes'),
            }}
          />

          <TextField
            fullWidth
            margin="normal"
            label={t('valves.scheduleAt')}
            type="datetime-local"
            value={commandForm.scheduled_at}
            onChange={(e) => setCommandForm({ ...commandForm, scheduled_at: e.target.value })}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommandDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleScheduledCommand} variant="contained">
            {t('valves.schedule')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('valves.createSchedule')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label={t('valves.scheduleName')}
            value={scheduleForm.name || ''}
            onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>{t('valves.scheduleType')}</InputLabel>
            <Select
              value={scheduleForm.schedule_type}
              onChange={(e) => setScheduleForm({ ...scheduleForm, schedule_type: e.target.value as any })}
            >
              <MenuItem value="daily">{t('valves.daily')}</MenuItem>
              <MenuItem value="weekly">{t('valves.weekly')}</MenuItem>
              <MenuItem value="interval">{t('valves.interval')}</MenuItem>
              <MenuItem value="one_time">{t('valves.oneTime')}</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>{t('valves.action')}</InputLabel>
            <Select
              value={scheduleForm.action}
              onChange={(e) => setScheduleForm({ ...scheduleForm, action: e.target.value as any })}
            >
              <MenuItem value="open">{t('valves.open')}</MenuItem>
              <MenuItem value="close">{t('valves.close')}</MenuItem>
              <MenuItem value="set_position">{t('valves.setPosition')}</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            label={t('valves.startTime')}
            type="time"
            value={scheduleForm.start_time}
            onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
            InputLabelProps={{
              shrink: true,
            }}
          />

          {scheduleForm.schedule_type !== 'one_time' && (
            <TextField
              fullWidth
              margin="normal"
              label={t('valves.endTime')}
              type="time"
              value={scheduleForm.end_time}
              onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
              InputLabelProps={{
                shrink: true,
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleCreateSchedule} variant="contained">
            {t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Emergency Stop Dialog */}
      <Dialog open={emergencyDialogOpen} onClose={() => setEmergencyDialogOpen(false)}>
        <DialogTitle color="error">
          <Warning sx={{ mr: 1 }} />
          {t('valves.emergencyStop')}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {t('valves.emergencyStopConfirmation')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmergencyDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => {
              // Handle emergency stop for all valves
              setEmergencyDialogOpen(false);
            }}
            variant="contained"
            color="error"
          >
            {t('valves.confirmEmergencyStop')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ValveControl;