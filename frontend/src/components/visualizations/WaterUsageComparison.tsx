import React, { useState, useEffect } from 'react';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { motion } from '../../utils/motion';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ComparisonData {
  labels: string[];
  yourUsage: number[];
  averageUsage: number[];
  efficientUsage: number[];
}

interface WaterUsageComparisonProps {
  data: ComparisonData;
  className?: string;
}

const WaterUsageComparison: React.FC<WaterUsageComparisonProps> = ({ data, className = '' }) => {
  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    if (!data) return;

    setChartData({
      labels: data.labels,
      datasets: [
        {
          label: 'Your Usage',
          data: data.yourUsage,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1
        },
        {
          label: 'Community Average',
          data: data.averageUsage,
          backgroundColor: 'rgba(107, 114, 128, 0.8)',
          borderColor: 'rgb(107, 114, 128)',
          borderWidth: 1
        },
        {
          label: 'Efficient Usage Target',
          data: data.efficientUsage,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1
        }
      ]
    });
  }, [data]);

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
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        titleColor: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#111827',
        bodyColor: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#374151',
        borderColor: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 4,
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
        text: 'Water Usage Comparison',
        color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#111827',
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
    scales: {
      x: {
        grid: {
          color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#6b7280'
        }
      },
      y: {
        grid: {
          color: document.documentElement.classList.contains('dark') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#6b7280',
          callback: function(value: any) {
            return value + ' L';
          }
        },
        beginAtZero: true
      }
    }
  };

  // Calculate efficiency metrics
  const calculateEfficiency = () => {
    if (!data.yourUsage.length || !data.averageUsage.length) return null;
    
    const yourTotal = data.yourUsage.reduce((sum, val) => sum + val, 0);
    const avgTotal = data.averageUsage.reduce((sum, val) => sum + val, 0);
    const efficientTotal = data.efficientUsage.reduce((sum, val) => sum + val, 0);
    
    const vsAverage = ((avgTotal - yourTotal) / avgTotal) * 100;
    const vsEfficient = ((yourTotal - efficientTotal) / efficientTotal) * 100;
    
    return {
      vsAverage,
      vsEfficient,
      isMoreEfficient: vsAverage > 0
    };
  };

  const efficiency = calculateEfficiency();

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Usage Comparison
      </h3>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="h-64 md:h-80"
        aria-live="polite"
      >
        <Bar data={chartData} options={options} />
      </motion.div>
      
      {efficiency && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`p-4 rounded-lg ${
              efficiency.isMoreEfficient 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
            }`}
          >
            <h4 className={`text-sm font-medium ${
              efficiency.isMoreEfficient ? 'text-green-800 dark:text-green-300' : 'text-yellow-800 dark:text-yellow-300'
            }`}>
              Compared to Community Average
            </h4>
            <p className="mt-1 text-2xl font-bold">
              {efficiency.isMoreEfficient ? (
                <span className="text-green-600 dark:text-green-400">{Math.abs(efficiency.vsAverage).toFixed(1)}% less</span>
              ) : (
                <span className="text-yellow-600 dark:text-yellow-400">{Math.abs(efficiency.vsAverage).toFixed(1)}% more</span>
              )}
            </p>
            <p className={`mt-1 text-sm ${
              efficiency.isMoreEfficient ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
            }`}>
              {efficiency.isMoreEfficient 
                ? 'Great job! You\'re using less water than the average household.' 
                : 'Your water usage is higher than the community average.'}
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
          >
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Compared to Efficiency Target
            </h4>
            <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Math.abs(efficiency.vsEfficient).toFixed(1)}% {efficiency.vsEfficient > 0 ? 'above' : 'below'}
            </p>
            <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
              {efficiency.vsEfficient <= 0 
                ? 'Excellent! You\'re meeting or exceeding efficiency targets.' 
                : 'There\'s room to improve your water efficiency.'}
            </p>
          </motion.div>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        <p>
          This chart compares your water usage with the community average and efficiency targets.
          Understanding how your consumption compares can help you make more informed decisions about water usage.
        </p>
      </div>
    </div>
  );
};

export default WaterUsageComparison;