const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check if imagemin is installed
try {
  require.resolve('imagemin');
  require.resolve('imagemin-mozjpeg');
  require.resolve('imagemin-pngquant');
  require.resolve('imagemin-svgo');
  require.resolve('imagemin-gifsicle');
} catch (e) {
  console.log('Installing required packages...');
  execSync('npm install --no-save imagemin imagemin-mozjpeg imagemin-pngquant imagemin-svgo imagemin-gifsicle');
}

const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');
const imageminSvgo = require('imagemin-svgo');
const imageminGifsicle = require('imagemin-gifsicle');

const IMAGES_DIR = path.join(__dirname, '../public/images');
const OUTPUT_DIR = path.join(__dirname, '../public/images-optimized');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function optimizeImages() {
  console.log('Optimizing images...');
  
  try {
    const files = await imagemin([`${IMAGES_DIR}/**/*.{jpg,jpeg,png,svg,gif}`], {
      destination: OUTPUT_DIR,
      plugins: [
        imageminMozjpeg({ quality: 80 }),
        imageminPngquant({ quality: [0.65, 0.8] }),
        imageminSvgo({
          plugins: [
            { name: 'removeViewBox', active: false },
            { name: 'cleanupIDs', active: false }
          ]
        }),
        imageminGifsicle({ optimizationLevel: 2 })
      ]
    });
    
    console.log(`Optimized ${files.length} images`);
    
    // Replace original images with optimized ones
    files.forEach(file => {
      const relativePath = path.relative(OUTPUT_DIR, file.destinationPath);
      const originalPath = path.join(IMAGES_DIR, relativePath);
      
      // Create directory if it doesn't exist
      const dir = path.dirname(originalPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.copyFileSync(file.destinationPath, originalPath);
      console.log(`Replaced: ${relativePath}`);
    });
    
    // Clean up
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
    
    console.log('Image optimization complete!');
  } catch (error) {
    console.error('Error optimizing images:', error);
    process.exit(1);
  }
}

optimizeImages();