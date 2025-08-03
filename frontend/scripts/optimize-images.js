#!/usr/bin/env node

/**
 * Image Optimization Script
 * * This script optimizes all images in the src directory:
 * - Converts images to WebP format
 * - Generates multiple sizes for responsive images
 * - Optimizes SVGs using SVGO
 * - Compresses PNG and JPEG images
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { optimize } from 'svgo';
import { execSync } from 'child_process';

// FIX: Definisikan ulang __dirname untuk ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  // Source directory containing images
  sourceDir: path.resolve(__dirname, '../src'),
  
  // Output directory for optimized images
  outputDir: path.resolve(__dirname, '../public/images'),
  
  // Image extensions to process
  extensions: ['.jpg', '.jpeg', '.png', '.gif'],
  
  // Sizes for responsive images
  sizes: [640, 750, 828, 1080, 1200, 1920],
  
  // Quality settings
  quality: {
    webp: 80,
    jpeg: 80,
    png: 80
  }
};

// Create output directory if it doesn't exist
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// Find all image files
function findImageFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findImageFiles(filePath, fileList);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (config.extensions.includes(ext) || ext === '.svg') {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

// Process SVG files
async function optimizeSvg(filePath) {
  try {
    const filename = path.basename(filePath);
    const outputPath = path.join(config.outputDir, filename);
    
    const svgString = fs.readFileSync(filePath, 'utf8');
    const result = optimize(svgString, {
      path: filePath,
      multipass: true,
      plugins: [
        'preset-default',
        'removeDimensions',
        'removeViewBox',
        {
          name: 'addAttributesToSVGElement',
          params: {
            attributes: [{ width: '100%' }, { height: '100%' }]
          }
        }
      ]
    });
    
    fs.writeFileSync(outputPath, result.data);
    console.log(`Optimized SVG: ${filename}`);
    
    return outputPath;
  } catch (error) {
    console.error(`Error optimizing SVG ${filePath}:`, error);
    return null;
  }
}

// Process raster images (JPG, PNG, etc.)
async function optimizeRasterImage(filePath) {
  try {
    const filename = path.basename(filePath, path.extname(filePath));
    const ext = path.extname(filePath).toLowerCase();
    
    // Base sharp instance
    let sharpInstance = sharp(filePath);
    
    // Generate WebP version
    const webpOutputPath = path.join(config.outputDir, `${filename}.webp`);
    await sharpInstance.webp({ quality: config.quality.webp }).toFile(webpOutputPath);
    console.log(`Created WebP: ${filename}.webp`);
    
    // Generate original format with optimization
    const outputPath = path.join(config.outputDir, path.basename(filePath));
    if (ext === '.jpg' || ext === '.jpeg') {
      await sharpInstance.jpeg({ quality: config.quality.jpeg }).toFile(outputPath);
    } else if (ext === '.png') {
      await sharpInstance.png({ quality: config.quality.png }).toFile(outputPath);
    } else {
      await sharpInstance.toFile(outputPath);
    }
    console.log(`Optimized: ${path.basename(filePath)}`);
    
    // Generate responsive sizes
    for (const width of config.sizes) {
      // Skip if the image is smaller than this size
      const metadata = await sharp(filePath).metadata();
      if (metadata.width <= width) continue;
      
      // Resize and output WebP
      const responsiveWebpPath = path.join(config.outputDir, `${filename}-${width}w.webp`);
      await sharp(filePath)
        .resize(width)
        .webp({ quality: config.quality.webp })
        .toFile(responsiveWebpPath);
      
      // Resize and output original format
      const responsivePath = path.join(config.outputDir, `${filename}-${width}w${ext}`);
      if (ext === '.jpg' || ext === '.jpeg') {
        await sharp(filePath)
          .resize(width)
          .jpeg({ quality: config.quality.jpeg })
          .toFile(responsivePath);
      } else if (ext === '.png') {
        await sharp(filePath)
          .resize(width)
          .png({ quality: config.quality.png })
          .toFile(responsivePath);
      } else {
        await sharp(filePath)
          .resize(width)
          .toFile(responsivePath);
      }
    }
    
    console.log(`Generated responsive versions for: ${filename}`);
    return outputPath;
  } catch (error) {
    console.error(`Error optimizing image ${filePath}:`, error);
    return null;
  }
}

// Main function
async function main() {
  console.log('Starting image optimization...');
  
  // Find all image files
  const imageFiles = findImageFiles(config.sourceDir);
  console.log(`Found ${imageFiles.length} images to optimize`);
  
  // Process each image
  for (const filePath of imageFiles) {
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.svg') {
      await optimizeSvg(filePath);
    } else {
      await optimizeRasterImage(filePath);
    }
  }
  
  console.log('Image optimization complete!');
}

// Run the script
main().catch(error => {
  console.error('Error running image optimization:', error);
  process.exit(1);
});
