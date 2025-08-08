import React from 'react';
import { motion } from 'framer-motion';
import { 
  BanknotesIcon, 
  ClockIcon,
  LightBulbIcon,
  BeakerIcon as DropletIcon,
  SparklesIcon as LeafIcon
} from '@heroicons/react/24/outline';

interface SavingsData {
  waterSaved: number; // in liters
  moneySaved: number; // in currency
  co2Reduced: number; // in kg
  timeSpan: number; // in days
}

interface WaterSavingsInsightsProps {
  data: SavingsData;
  className?: string;
}

const WaterSavingsInsights: React.FC<WaterSavingsInsightsProps> = ({ data, className = '' }) => {
  // Calculate equivalent metrics for better understanding
  const equivalents = {
    // Water saved in terms of everyday items
    showers: Math.round(data.waterSaved / 65), // Average shower uses ~65 liters
    bottlesOf500ml: Math.round(data.waterSaved / 0.5), // 500ml bottles
    
    // Environmental impact
    treesPlanted: Math.round(data.co2Reduced / 20), // Rough estimate: 1 tree absorbs ~20kg CO2 per year
    carKmNotDriven: Math.round(data.co2Reduced * 6), // Rough estimate: 1kg CO2 = ~6km in average car
  };

  // Tips based on data
  const getTips = () => {
    const tips = [
      "Fix leaky faucets promptly - a dripping tap can waste over 20,000 liters per year.",
      "Install water-efficient showerheads to save up to 40% of shower water usage.",
      "Collect and reuse water from rinsing fruits and vegetables for watering plants.",
      "Run washing machines and dishwashers only when full to maximize efficiency.",
      "Consider installing a rainwater harvesting system for garden irrigation.",
      "Take shorter showers - reducing shower time by 2 minutes can save up to 40 liters.",
      "Turn off the tap while brushing teeth to save up to 12 liters per minute.",
      "Water your garden in the early morning or evening to reduce evaporation.",
      "Use a broom instead of a hose to clean driveways and sidewalks.",
      "Check your water meter regularly to detect hidden leaks."
    ];
    
    // Return 3 random tips
    return tips.sort(() => 0.5 - Math.random()).slice(0, 3);
  };

  const waterSavingTips = getTips();

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Water Savings Insights
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <DropletIcon className="h-10 w-10 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Water Saved
              </h4>
              <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
                {data.waterSaved.toLocaleString()} L
              </p>
              <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
                over the last {data.timeSpan} days
              </p>
            </div>
          </div>
          <div className="mt-3 text-sm text-blue-700 dark:text-blue-300">
            <p>Equivalent to:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>{equivalents.showers} showers</li>
              <li>{equivalents.bottlesOf500ml.toLocaleString()} bottles (500ml)</li>
            </ul>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <LeafIcon className="h-10 w-10 text-green-600 dark:text-green-400" aria-hidden="true" />
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-medium text-green-800 dark:text-green-300">
                Environmental Impact
              </h4>
              <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                {data.co2Reduced.toLocaleString()} kg CO₂
              </p>
              <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                emissions reduced
              </p>
            </div>
          </div>
          <div className="mt-3 text-sm text-green-700 dark:text-green-300">
            <p>Equivalent to:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>{equivalents.treesPlanted} trees planted for a year</li>
              <li>{equivalents.carKmNotDriven.toLocaleString()} km not driven by car</li>
            </ul>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-100 dark:border-yellow-800"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <BanknotesIcon className="h-10 w-10 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                Financial Savings
              </h4>
              <p className="mt-1 text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                Rp {data.moneySaved.toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
                saved on your water bill
              </p>
            </div>
          </div>
          <div className="mt-3 text-sm text-yellow-700 dark:text-yellow-300">
            <p>
              By continuing your current water-saving habits, you could save approximately 
              Rp {Math.round(data.moneySaved * (365 / data.timeSpan)).toLocaleString()} per year.
            </p>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <ClockIcon className="h-10 w-10 text-purple-600 dark:text-purple-400" aria-hidden="true" />
            </div>
            <div className="ml-4">
              <h4 className="text-sm font-medium text-purple-800 dark:text-purple-300">
                Efficiency Trend
              </h4>
              <p className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">
                {(data.waterSaved / data.timeSpan).toFixed(1)} L/day
              </p>
              <p className="mt-1 text-sm text-purple-600 dark:text-purple-400">
                average daily savings
              </p>
            </div>
          </div>
          <div className="mt-3 text-sm text-purple-700 dark:text-purple-300">
            <p>
              At this rate, you'll save {(data.waterSaved * 12 / data.timeSpan).toLocaleString()} liters 
              over the next year, contributing to community water conservation efforts.
            </p>
          </div>
        </motion.div>
      </div>
      
      {/* Water Saving Tips */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
      >
        <div className="flex items-center mb-3">
          <LightBulbIcon className="h-6 w-6 text-amber-500 dark:text-amber-400 mr-2" aria-hidden="true" />
          <h4 className="text-base font-medium text-gray-900 dark:text-white">
            Water Saving Tips
          </h4>
        </div>
        <ul className="space-y-3">
          {waterSavingTips.map((tip, index) => (
            <motion.li 
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.5 + (index * 0.1) }}
              className="flex items-start"
            >
              <span className="flex-shrink-0 h-5 w-5 text-green-500 dark:text-green-400">•</span>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">{tip}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
};

export default WaterSavingsInsights;