#!/usr/bin/env node

/**
 * Translation Checker Script
 * 
 * This script checks for missing translations between language files.
 * It compares the English and Indonesian translation files and reports any missing keys.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  localesDir: path.resolve(__dirname, '../public/locales'),
  languages: ['en', 'id'],
  namespaces: ['translation'],
};

// Utility function to get all keys from an object (including nested keys)
function getAllKeys(obj, prefix = '') {
  let keys = [];
  
  for (const key in obj) {
    const newPrefix = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = [...keys, ...getAllKeys(obj[key], newPrefix)];
    } else {
      keys.push(newPrefix);
    }
  }
  
  return keys;
}

// Utility function to check if a key exists in an object
function keyExists(obj, key) {
  const parts = key.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (!current[part]) {
      return false;
    }
    current = current[part];
  }
  
  return true;
}

// Utility function to get a value from an object using a dot-notation key
function getValue(obj, key) {
  const parts = key.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (!current[part]) {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

// Main function
function checkTranslations() {
  console.log('Checking translations...');
  
  const results = {
    missingKeys: {},
    emptyValues: {},
  };
  
  // Initialize results structure
  config.languages.forEach(lang => {
    results.missingKeys[lang] = [];
    results.emptyValues[lang] = [];
  });
  
  // Load all translation files
  const translations = {};
  
  config.languages.forEach(lang => {
    translations[lang] = {};
    
    config.namespaces.forEach(ns => {
      const filePath = path.join(config.localesDir, lang, `${ns}.json`);
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        translations[lang][ns] = JSON.parse(content);
      } catch (error) {
        console.error(`Error loading ${filePath}:`, error.message);
        process.exit(1);
      }
    });
  });
  
  // Check for missing keys and empty values
  config.namespaces.forEach(ns => {
    // Get all keys from all languages
    const allKeys = new Set();
    
    config.languages.forEach(lang => {
      const keys = getAllKeys(translations[lang][ns]);
      keys.forEach(key => allKeys.add(key));
    });
    
    // Check each key in each language
    allKeys.forEach(key => {
      config.languages.forEach(lang => {
        if (!keyExists(translations[lang][ns], key)) {
          results.missingKeys[lang].push(`${ns}:${key}`);
        } else {
          const value = getValue(translations[lang][ns], key);
          if (value === '' || value === null || value === undefined) {
            results.emptyValues[lang].push(`${ns}:${key}`);
          }
        }
      });
    });
  });
  
  // Print results
  let hasIssues = false;
  
  console.log('\n=== Missing Translation Keys ===');
  config.languages.forEach(lang => {
    if (results.missingKeys[lang].length > 0) {
      hasIssues = true;
      console.log(`\n${lang.toUpperCase()} is missing ${results.missingKeys[lang].length} keys:`);
      results.missingKeys[lang].forEach(key => {
        console.log(`  - ${key}`);
      });
    } else {
      console.log(`\n${lang.toUpperCase()}: No missing keys.`);
    }
  });
  
  console.log('\n=== Empty Translation Values ===');
  config.languages.forEach(lang => {
    if (results.emptyValues[lang].length > 0) {
      hasIssues = true;
      console.log(`\n${lang.toUpperCase()} has ${results.emptyValues[lang].length} empty values:`);
      results.emptyValues[lang].forEach(key => {
        console.log(`  - ${key}`);
      });
    } else {
      console.log(`\n${lang.toUpperCase()}: No empty values.`);
    }
  });
  
  console.log('\n=== Summary ===');
  if (hasIssues) {
    console.log('❌ Translation issues found. Please fix the issues above.');
    return 1;
  } else {
    console.log('✅ All translations are complete!');
    return 0;
  }
}

// Run the script
const exitCode = checkTranslations();
process.exit(exitCode);