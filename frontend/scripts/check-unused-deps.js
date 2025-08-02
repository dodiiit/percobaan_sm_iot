#!/usr/bin/env node

/**
 * This script checks for unused dependencies in the project
 * Run with: node scripts/check-unused-deps.js
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

console.log(`${colors.bright}${colors.blue}=== IndoWater Dependency Checker ====${colors.reset}\n`);
console.log(`${colors.cyan}Checking for unused dependencies...${colors.reset}`);

try {
  // Install depcheck if not already installed
  try {
    require.resolve('depcheck');
  } catch (error) {
    console.log(`${colors.yellow}Installing depcheck...${colors.reset}`);
    execSync('npm install --no-save depcheck', { stdio: 'inherit' });
  }
  
  // Run depcheck
  const depcheck = require('depcheck');
  
  const options = {
    ignoreBinPackage: false,
    skipMissing: false,
    ignorePatterns: [
      'dist',
      'node_modules',
      'coverage',
      '*.test.ts',
      '*.test.tsx',
    ],
    ignoreMatches: [
      '@types/*',
      'typescript',
      'eslint*',
      '@typescript-eslint/*',
      'vitest',
      '@vitest/*',
      '@testing-library/*',
    ],
    specials: [
      'eslint',
      'tslint',
      'webpack',
      'vite',
    ],
  };
  
  const rootDir = path.resolve(__dirname, '..');
  
  depcheck(rootDir, options)
    .then((result) => {
      const unusedDeps = Object.keys(result.dependencies);
      const unusedDevDeps = Object.keys(result.devDependencies);
      
      if (unusedDeps.length === 0 && unusedDevDeps.length === 0) {
        console.log(`\n${colors.green}✓ No unused dependencies found!${colors.reset}`);
      } else {
        console.log(`\n${colors.yellow}Found unused dependencies:${colors.reset}`);
        
        if (unusedDeps.length > 0) {
          console.log(`\n${colors.bright}Unused dependencies:${colors.reset}`);
          unusedDeps.forEach((dep) => {
            console.log(`${colors.red}• ${dep}${colors.reset}`);
          });
          
          console.log(`\n${colors.yellow}To remove unused dependencies, run:${colors.reset}`);
          console.log(`${colors.dim}npm uninstall ${unusedDeps.join(' ')}${colors.reset}`);
        }
        
        if (unusedDevDeps.length > 0) {
          console.log(`\n${colors.bright}Unused dev dependencies:${colors.reset}`);
          unusedDevDeps.forEach((dep) => {
            console.log(`${colors.red}• ${dep}${colors.reset}`);
          });
          
          console.log(`\n${colors.yellow}To remove unused dev dependencies, run:${colors.reset}`);
          console.log(`${colors.dim}npm uninstall ${unusedDevDeps.join(' ')}${colors.reset}`);
        }
      }
      
      // Check for missing dependencies
      const missingDeps = Object.keys(result.missing);
      if (missingDeps.length > 0) {
        console.log(`\n${colors.yellow}Found missing dependencies:${colors.reset}`);
        
        missingDeps.forEach((dep) => {
          const files = result.missing[dep];
          console.log(`${colors.red}• ${dep}${colors.reset} (used in ${files.length} files)`);
          files.slice(0, 3).forEach((file) => {
            console.log(`  ${colors.dim}${path.relative(rootDir, file)}${colors.reset}`);
          });
          if (files.length > 3) {
            console.log(`  ${colors.dim}...and ${files.length - 3} more files${colors.reset}`);
          }
        });
        
        console.log(`\n${colors.yellow}To install missing dependencies, run:${colors.reset}`);
        console.log(`${colors.dim}npm install ${missingDeps.join(' ')}${colors.reset}`);
      }
      
      console.log(`\n${colors.bright}${colors.blue}=== Check Complete ====${colors.reset}\n`);
    });
  
} catch (error) {
  console.error(`\n${colors.red}✗ Error during dependency check:${colors.reset}`, error);
  process.exit(1);
}