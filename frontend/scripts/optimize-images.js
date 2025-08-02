#!/usr/bin/env node

/**
 * This script optimizes images in the public directory
 * Run with: node scripts/optimize-images.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

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

// Configuration
const config = {
  inputDir: path.join(__dirname, '../public'),
  outputDir: path.join(__dirname, '../public/optimized'),
  formats: ['webp', 'avif'],
  sizes: [320, 640, 960, 1280, 1920],
  quality: 80,
  extensions: ['.jpg', '.jpeg', '.png', '.gif'],
};

// Create output directory if it doesn't exist
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

console.log(`${colors.bright}${colors.blue}=== IndoWater Image Optimization ====${colors.reset}\n`);

// Find all images in the input directory
function findImages(dir) {
  let results = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      // Skip the optimized directory to avoid processing already optimized images
      if (itemPath !== config.outputDir) {
        results = results.concat(findImages(itemPath));
      }
    } else {
      const ext = path.extname(itemPath).toLowerCase();
      if (config.extensions.includes(ext)) {
        results.push(itemPath);
      }
    }
  }
  
  return results;
}

// Process an image
async function processImage(imagePath) {
  const filename = path.basename(imagePath, path.extname(imagePath));
  const originalSize = fs.statSync(imagePath).size;
  let totalSaved = 0;
  
  console.log(`\n${colors.cyan}Processing:${colors.reset} ${colors.dim}${imagePath}${colors.reset}`);
  console.log(`${colors.yellow}Original size:${colors.reset} ${(originalSize / 1024).toFixed(2)} KB`);
  
  // Process each format and size
  for (const format of config.formats) {
    for (const size of config.sizes) {
      const outputFilename = `${filename}-${size}.${format}`;
      const outputPath = path.join(config.outputDir, outputFilename);
      
      try {
        // Resize and convert image
        await sharp(imagePath)
          .resize(size, null, { withoutEnlargement: true })
          .toFormat(format, { quality: config.quality })
          .toFile(outputPath);
        
        const newSize = fs.statSync(outputPath).size;
        const saved = originalSize - newSize;
        totalSaved += saved;
        
        console.log(`${colors.green}✓${colors.reset} ${outputFilename}: ${(newSize / 1024).toFixed(2)} KB (${(saved / 1024).toFixed(2)} KB saved)`);
      } catch (error) {
        console.error(`${colors.red}✗${colors.reset} Error processing ${outputFilename}:`, error.message);
      }
    }
  }
  
  console.log(`${colors.green}Total saved:${colors.reset} ${(totalSaved / 1024).toFixed(2)} KB`);
  
  return {
    originalSize,
    totalSaved,
  };
}

// Main function
async function main() {
  try {
    // Check if sharp is installed
    try {
      require.resolve('sharp');
    } catch (error) {
      console.log(`${colors.yellow}Sharp is not installed. Installing now...${colors.reset}`);
      execSync('npm install --save-dev sharp', { stdio: 'inherit' });
      console.log(`${colors.green}Sharp installed successfully.${colors.reset}`);
    }
    
    const images = findImages(config.inputDir);
    
    if (images.length === 0) {
      console.log(`${colors.yellow}No images found in ${config.inputDir}${colors.reset}`);
      return;
    }
    
    console.log(`${colors.cyan}Found ${images.length} images to optimize${colors.reset}`);
    
    let totalOriginalSize = 0;
    let totalSaved = 0;
    
    // Process all images
    for (const imagePath of images) {
      const { originalSize, totalSaved: saved } = await processImage(imagePath);
      totalOriginalSize += originalSize;
      totalSaved += saved;
    }
    
    console.log(`\n${colors.bright}${colors.blue}=== Optimization Complete ====${colors.reset}`);
    console.log(`${colors.cyan}Total images processed:${colors.reset} ${images.length}`);
    console.log(`${colors.cyan}Total original size:${colors.reset} ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`${colors.cyan}Total size saved:${colors.reset} ${(totalSaved / 1024 / 1024).toFixed(2)} MB (${(totalSaved / totalOriginalSize * 100).toFixed(2)}%)`);
    
    console.log(`\n${colors.yellow}Optimized images are available in:${colors.reset} ${colors.bright}${config.outputDir}${colors.reset}`);
    console.log(`${colors.yellow}Use these images in your application with the OptimizedImage component.${colors.reset}`);
    
  } catch (error) {
    console.error(`\n${colors.red}✗ Error during optimization:${colors.reset}`, error);
    process.exit(1);
  }
}

main();