import React, { useState, useEffect } from 'react';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  PieController,
  DoughnutController,
  RadarController,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  PieController,
  DoughnutController,
  RadarController,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ConsumptionData {
  daily: {
    labels: string[];
    values: number[];
  };
  weekly: {
    labels: string[];
    values: number[];
  };
  monthly: {
    labels: string[];
    values: number[];
  };
  yearly: {
    labels: string[];
    values: number[];
  };
  hourly?: {
    labels: string[];
    values: number[];
  };
}

interface ConsumptionPatternsProps {
  data: ConsumptionData;
  timeRange: string;
  className?: string;
}

// Helper function to get dark mode status
const isDarkMode = () => document.documentElement.classList.contains('dark');

// Helper function to generate gradient
const createGradient = (ctx: CanvasRenderingContext2D, color1: string, color2: string) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);
  return gradient;
};

const ConsumptionPatterns: React.FC<ConsumptionPatternsProps> = ({ data, timeRange, className = '' }) => {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'doughnut' | 'radar'>('line');
  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    if (!data || !data[timeRange as keyof ConsumptionData]) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    const primaryGradient = createGradient(ctx, 'rgba(59, 130, 246, 0.8)', 'rgba(59, 130, 246, 0.1)');
    const secondaryGradient = createGradient(ctx, 'rgba(16, 185, 129, 0.8)', 'rgba(16, 185, 129, 0.1)');

    const timeRangeData = data[timeRange as keyof ConsumptionData];
    const labels = timeRangeData?.labels || [];
    const values = timeRangeData?.values || [];

    // Calculate average consumption
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const averageData = Array(values.length).fill(average);

    // For doughnut chart, we need to aggregate data
    if (chartType === 'doughnut') {
      // Group data into categories (low, medium, high consumption)
      const low = values.filter(v => v < average * 0.8).length;
      const medium = values.filter(v => v >= average * 0.8 && v <= average * 1.2).length;
      const high = values.filter(v => v > average * 1.2).length;

      setChartData({
        labels: ['Low Usage', 'Average Usage', 'High Usage'],
        datasets: [
          {
            data: [low, medium, high],
            backgroundColor: [
              'rgba(16, 185, 129, 0.7)',
              'rgba(59, 130, 246, 0.7)',
              'rgba(239, 68, 68, 0.7)'
            ],
            borderColor: [
              'rgba(16, 185, 129, 1)',
              'rgba(59, 130, 246, 1)',
              'rgba(239, 68, 68, 1)'
            ],
            borderWidth: 1,
            hoverOffset: 4
          }
        ]
      });
    } 
    // For radar chart, we need to transform data
    else if (chartType === 'radar') {
      // For radar, we'll use a subset of data points to avoid overcrowding
      const radarLabels = labels.filter((_, i) => i % Math.ceil(labels.length / 8) === 0);
      const radarValues = values.filter((_, i) => i % Math.ceil(values.length / 8) === 0);
      
      setChartData({
        labels: radarLabels,
        datasets: [
          {
            label: 'Consumption',
            data: radarValues,
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(59, 130, 246, 1)'
          }
        ]
      });
    }
    // For line and bar charts
    else {
      setChartData({
        labels,
        datasets: [
          {
            label: 'Water Consumption (Liters)',
            data: values,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: chartType === 'line' ? 'rgba(59, 130, 246, 0.1)' : primaryGradient,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: 'rgb(59, 130, 246)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Average Consumption',
            data: averageData,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderDash: [5, 5],
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            tension: 0.4
          }
        ]
      });
    }
  }, [data, timeRange, chartType]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart' as const
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: isDarkMode() ? '#e5e7eb' : '#374151',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: isDarkMode() ? '#1f2937' : '#ffffff',
        titleColor: isDarkMode() ? '#e5e7eb' : '#111827',
        bodyColor: isDarkMode() ? '#d1d5db' : '#374151',
        borderColor: isDarkMode() ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 4,
        displayColors: true,
        usePointStyle: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toLocaleString() + ' L';
            }
            return label;
          }
        }
      },
      title: {
        display: true,
        text: `Water Consumption - ${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}`,
        color: isDarkMode() ? '#e5e7eb' : '#111827',
        font: {
          size: 16,
          weight: 'bold' as const
        },
        padding: {
          top: 10,
          bottom: 20
        }
      }
    },
    scales: chartType !== 'doughnut' && chartType !== 'radar' ? {
      x: {
        grid: {
          color: isDarkMode() ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: isDarkMode() ? '#d1d5db' : '#6b7280',
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: {
        grid: {
          color: isDarkMode() ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: isDarkMode() ? '#d1d5db' : '#6b7280',
          callback: function(value: any) {
            return value + ' L';
          }
        },
        beginAtZero: true
      }
    } : undefined
  };

  const chartTypes = [
    { id: 'line', label: 'Line Chart' },
    { id: 'bar', label: 'Bar Chart' },
    { id: 'doughnut', label: 'Usage Distribution' },
    { id: 'radar', label: 'Pattern Analysis' }
  ];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 ${className}`}>
      <div className="flex flex-wrap items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Consumption Patterns
        </h3>
        <div className="flex space-x-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mt-2 sm:mt-0">
          {chartTypes.map((type) => (
            <button
              key={type.id}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                chartType === type.id
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setChartType(type.id as any)}
              aria-label={`Switch to ${type.label}`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div 
          key={chartType}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="h-80"
          aria-live="polite"
        >
          {chartType === 'line' && <Line data={chartData} options={options} />}
          {chartType === 'bar' && <Bar data={chartData} options={options} />}
          {chartType === 'doughnut' && <Doughnut data={chartData} options={options} />}
          {chartType === 'radar' && <Radar data={chartData} options={options} />}
        </motion.div>
      </AnimatePresence>
      
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        <p>
          This visualization shows your water consumption patterns over time. Switch between different chart types to gain different insights into your usage patterns.
        </p>
      </div>
    </div>
  );
};

export default ConsumptionPatterns;