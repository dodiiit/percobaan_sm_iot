import React, { useEffect } from 'react';
import { monitorLongTasks, monitorResourceLoading, monitorPaints } from '../../utils/performance';

interface PerformanceMonitorProps {
  enabled?: boolean;
}

/**
 * Component that monitors performance metrics
 * This component doesn't render anything visible
 */
const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ enabled = true }) => {
  useEffect(() => {
    if (!enabled) return;
    
    // Start monitoring various performance metrics
    const disconnectLongTasks = monitorLongTasks();
    const disconnectResourceLoading = monitorResourceLoading();
    const disconnectPaints = monitorPaints();
    
    // Clean up when component unmounts
    return () => {
      disconnectLongTasks();
      disconnectResourceLoading();
      disconnectPaints();
    };
  }, [enabled]);

  return null;
};

export default PerformanceMonitor;