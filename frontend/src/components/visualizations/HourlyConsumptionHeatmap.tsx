import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface HourlyData {
  day: number; // 0-6 (Sunday-Saturday)
  hour: number; // 0-23
  value: number; // consumption value
}

interface HourlyConsumptionHeatmapProps {
  data: HourlyData[];
  className?: string;
}

const HourlyConsumptionHeatmap: React.FC<HourlyConsumptionHeatmapProps> = ({ data, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const cellSize = Math.min(
      Math.floor(canvas.width / 24), // 24 hours
      Math.floor(canvas.height / 7)  // 7 days
    );
    
    const width = cellSize * 24;
    const height = cellSize * 7;
    
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Find min and max values for color scaling
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue;

    // Draw heatmap cells
    data.forEach(d => {
      const x = d.hour * cellSize;
      const y = d.day * cellSize;
      
      // Calculate color intensity (0-1)
      const normalizedValue = valueRange === 0 ? 0.5 : (d.value - minValue) / valueRange;
      
      // Use blue gradient for water consumption
      const r = Math.floor(59 + (1 - normalizedValue) * 196);
      const g = Math.floor(130 + (1 - normalizedValue) * 125);
      const b = Math.floor(246);
      const a = 0.2 + normalizedValue * 0.8;
      
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      ctx.fillRect(x, y, cellSize, cellSize);
      
      // Add cell border
      ctx.strokeStyle = document.documentElement.classList.contains('dark') 
        ? 'rgba(255, 255, 255, 0.1)' 
        : 'rgba(0, 0, 0, 0.1)';
      ctx.strokeRect(x, y, cellSize, cellSize);
    });

    // Add tooltip functionality
    const handleMouseMove = (e: MouseEvent) => {
      if (!tooltipRef.current) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const hourIndex = Math.floor(x / cellSize);
      const dayIndex = Math.floor(y / cellSize);
      
      if (hourIndex >= 0 && hourIndex < 24 && dayIndex >= 0 && dayIndex < 7) {
        const cellData = data.find(d => d.hour === hourIndex && d.day === dayIndex);
        
        if (cellData) {
          tooltipRef.current.style.display = 'block';
          tooltipRef.current.style.left = `${e.clientX + 10}px`;
          tooltipRef.current.style.top = `${e.clientY + 10}px`;
          tooltipRef.current.innerHTML = `
            <div class="font-medium">${days[dayIndex]} at ${hours[hourIndex]}</div>
            <div>${cellData.value.toLocaleString()} L</div>
          `;
        } else {
          tooltipRef.current.style.display = 'none';
        }
      } else {
        tooltipRef.current.style.display = 'none';
      }
    };
    
    const handleMouseLeave = () => {
      if (tooltipRef.current) {
        tooltipRef.current.style.display = 'none';
      }
    };
    
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [data]);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Hourly Consumption Heatmap
      </h3>
      
      <div className="relative overflow-x-auto">
        <div className="flex">
          {/* Y-axis labels (days) */}
          <div className="flex flex-col justify-around pr-2 text-xs text-gray-500 dark:text-gray-400">
            {days.map(day => (
              <div key={day} className="h-8 flex items-center">
                {day.substring(0, 3)}
              </div>
            ))}
          </div>
          
          <div className="flex flex-col">
            {/* Canvas for heatmap */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <canvas 
                ref={canvasRef} 
                className="w-full h-auto" 
                style={{ minHeight: '200px' }}
                aria-label="Hourly water consumption heatmap"
                role="img"
              />
              
              {/* Tooltip */}
              <div 
                ref={tooltipRef}
                className="absolute hidden bg-white dark:bg-gray-700 p-2 rounded shadow-lg text-sm z-10 pointer-events-none text-gray-800 dark:text-gray-200"
                style={{ minWidth: '120px' }}
              />
            </motion.div>
            
            {/* X-axis labels (hours) */}
            <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400 overflow-hidden">
              {[0, 6, 12, 18, 23].map(hour => (
                <div key={hour} style={{ width: `${100 / 24}%`, marginLeft: hour === 0 ? 0 : `${(hour - [0, 6, 12, 18, 23][([0, 6, 12, 18, 23].indexOf(hour) - 1)]) * (100 / 24)}%` }}>
                  {hour}:00
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        <p>
          This heatmap shows your water consumption patterns by day of week and hour of day. 
          Darker blue indicates higher water usage.
        </p>
      </div>
    </div>
  );
};

export default HourlyConsumptionHeatmap;