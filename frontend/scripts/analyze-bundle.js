#!/usr/bin/env node

/**
 * This script builds the application and generates a bundle analysis report
 * Run with: node scripts/analyze-bundle.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

console.log(`${colors.bright}${colors.blue}=== IndoWater Bundle Analysis ====${colors.reset}\n`);
console.log(`${colors.cyan}Building application for production...${colors.reset}`);

try {
  // Build the application with stats enabled
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log(`\n${colors.green}✓ Build completed successfully${colors.reset}`);
  console.log(`\n${colors.cyan}Analyzing bundle size...${colors.reset}`);
  
  // Check if stats.html was generated
  const statsPath = path.join(__dirname, '../dist/stats.html');
  if (fs.existsSync(statsPath)) {
    console.log(`\n${colors.green}✓ Bundle analysis report generated at:${colors.reset} ${colors.bright}dist/stats.html${colors.reset}`);
    console.log(`\n${colors.yellow}Open this file in your browser to view the detailed bundle analysis.${colors.reset}`);
    
    // Try to open the stats file automatically
    try {
      if (process.platform === 'darwin') {
        execSync(`open ${statsPath}`);
      } else if (process.platform === 'win32') {
        execSync(`start ${statsPath}`);
      } else if (process.platform === 'linux') {
        execSync(`xdg-open ${statsPath}`);
      }
    } catch (error) {
      console.log(`\n${colors.yellow}Could not open the report automatically. Please open it manually.${colors.reset}`);
    }
  } else {
    console.log(`\n${colors.red}✗ Bundle analysis report was not generated.${colors.reset}`);
    console.log(`\n${colors.yellow}Make sure rollup-plugin-visualizer is properly configured in vite.config.ts.${colors.reset}`);
  }
  
  // Display gzip sizes of main chunks
  console.log(`\n${colors.cyan}Calculating gzip sizes...${colors.reset}`);
  
  const distDir = path.join(__dirname, '../dist');
  const jsDir = path.join(distDir, 'assets/js');
  
  if (fs.existsSync(jsDir)) {
    const jsFiles = fs.readdirSync(jsDir).filter(file => file.endsWith('.js'));
    
    if (jsFiles.length > 0) {
      console.log(`\n${colors.bright}JavaScript Chunks:${colors.reset}`);
      
      jsFiles.forEach(file => {
        const filePath = path.join(jsDir, file);
        const stats = fs.statSync(filePath);
        const sizeKb = (stats.size / 1024).toFixed(2);
        
        // Get gzip size
        try {
          const gzipSize = execSync(`gzip -c "${filePath}" | wc -c`, { encoding: 'utf8' });
          const gzipSizeKb = (parseInt(gzipSize.trim()) / 1024).toFixed(2);
          
          console.log(`${colors.dim}${file}${colors.reset}: ${sizeKb} KB (${colors.green}${gzipSizeKb} KB gzipped${colors.reset})`);
        } catch (error) {
          console.log(`${colors.dim}${file}${colors.reset}: ${sizeKb} KB (gzip size unavailable)`);
        }
      });
    }
  }
  
  console.log(`\n${colors.bright}${colors.blue}=== Analysis Complete ====${colors.reset}\n`);
  
} catch (error) {
  console.error(`\n${colors.red}✗ Error during build or analysis:${colors.reset}`, error);
  process.exit(1);
}