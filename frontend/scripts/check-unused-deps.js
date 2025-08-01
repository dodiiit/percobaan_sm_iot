const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check if depcheck is installed
try {
  require.resolve('depcheck');
} catch (e) {
  console.log('Installing depcheck...');
  execSync('npm install --no-save depcheck');
}

console.log('Checking for unused dependencies...');

try {
  // Run depcheck
  const result = execSync('npx depcheck --json', { encoding: 'utf8' });
  const depcheckResult = JSON.parse(result);
  
  // Create reports directory if it doesn't exist
  const reportsDir = path.join(__dirname, '../reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  // Format the results
  const unusedDependencies = depcheckResult.dependencies || [];
  const unusedDevDependencies = depcheckResult.devDependencies || [];
  
  const report = {
    unusedDependencies,
    unusedDevDependencies,
    totalUnused: unusedDependencies.length + unusedDevDependencies.length,
    timestamp: new Date().toISOString()
  };
  
  // Write the report to a file
  fs.writeFileSync(
    path.join(reportsDir, 'unused-dependencies.json'),
    JSON.stringify(report, null, 2)
  );
  
  // Print the results
  console.log('\nUnused Dependencies Report:');
  console.log('==========================');
  
  if (unusedDependencies.length > 0) {
    console.log('\nUnused Dependencies:');
    unusedDependencies.forEach(dep => console.log(`- ${dep}`));
  } else {
    console.log('\nNo unused dependencies found.');
  }
  
  if (unusedDevDependencies.length > 0) {
    console.log('\nUnused Dev Dependencies:');
    unusedDevDependencies.forEach(dep => console.log(`- ${dep}`));
  } else {
    console.log('\nNo unused dev dependencies found.');
  }
  
  console.log(`\nTotal unused: ${report.totalUnused}`);
  console.log(`Report saved to: reports/unused-dependencies.json`);
  
  if (report.totalUnused > 0) {
    console.log('\nTo remove unused dependencies, run:');
    
    if (unusedDependencies.length > 0) {
      console.log(`npm uninstall ${unusedDependencies.join(' ')}`);
    }
    
    if (unusedDevDependencies.length > 0) {
      console.log(`npm uninstall --save-dev ${unusedDevDependencies.join(' ')}`);
    }
  }
} catch (error) {
  console.error('Error checking dependencies:', error.message);
  process.exit(1);
}