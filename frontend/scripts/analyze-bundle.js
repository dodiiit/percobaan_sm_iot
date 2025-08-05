const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if source-map-explorer is installed
try {
  require.resolve('source-map-explorer');
} catch (e) {
  console.log('Installing source-map-explorer...');
  execSync('npm install --no-save source-map-explorer');
}

// Make sure we have source maps
process.env.GENERATE_SOURCEMAP = 'true';

// Build the app
console.log('Building the app with source maps...');
execSync('npm run build', { stdio: 'inherit' });

// Create reports directory
const reportsDir = path.join(__dirname, '../reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Run source-map-explorer
console.log('Analyzing bundle size...');
execSync(
  'npx source-map-explorer --html reports/bundle-analysis.html build/static/js/*.js',
  { stdio: 'inherit' }
);

console.log('Bundle analysis complete! Open reports/bundle-analysis.html to view the report.');