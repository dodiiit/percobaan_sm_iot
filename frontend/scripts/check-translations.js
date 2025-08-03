#!/usr/bin/env node

/**
 * Translation Checker Script
 * 
 * This script checks for missing translations between language files.
 * It compares the English and Indonesian translation files and reports any missing keys.
 */

import fs from 'fs';
import path from 'path';
import glob from 'glob';

// =================================================================
// Configuration
// =================================================================

const config = {
  localesDir: path.resolve(__dirname, '../src/locales'),
  sourceLocale: 'en',
  sourceCodeDir: path.resolve(__dirname, '../src'),
  fileExtensions: ['.js', '.jsx', '.ts', '.tsx']
};

// =================================================================
// Utility Functions
// =================================================================

/**
 * Loads a JSON file.
 * @param {string} filePath Path to the JSON file.
 * @returns {object | null} The parsed JSON object or null on error.
 */
function loadTranslations(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading or parsing file: ${filePath}`);
    console.error(error);
    return null;
  }
}

/**
 * Collects all translation keys used in the source code.
 * @param {string} dir Directory to search.
 * @returns {Set<string>} A set of all found translation keys.
 */
function collectAllKeys(dir) {
  const allKeys = new Set();
  const files = glob.sync(`${dir}/**/*(${config.fileExtensions.join('|')})`);

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.match(/t\(['"](.*?)['"]\)/g); // Matches t('key') or t("key")

    if (matches) {
      matches.forEach(match => {
        const key = match.replace(/t\(['"](.*?)['"]\)/, '$1');
        allKeys.add(key);
      });
    }
  });

  return allKeys;
}

/**
 * Checks for missing and unused keys in other locale files.
 * @param {object} sourceKeys Object of keys from the source locale.
 * @param {object} targetKeys Object of keys from the target locale.
 * @param {string} targetLocale The name of the target locale.
 * @param {Set<string>} usedKeys A set of keys found in the source code.
 */
function checkKeysExist(sourceKeys, targetKeys, targetLocale, usedKeys) {
  let hasErrors = false;

  console.log(`Checking '${targetLocale}.json'...`);

  // Check for missing keys
  for (const key in sourceKeys) {
    if (Object.prototype.hasOwnProperty.call(sourceKeys, key) && usedKeys.has(key)) {
      if (!Object.prototype.hasOwnProperty.call(targetKeys, key)) {
        console.error(`  [ERROR] Missing key in '${targetLocale}.json': '${key}'`);
        hasErrors = true;
      }
    }
  }

  // Check for unused keys
  for (const key in targetKeys) {
    if (Object.prototype.hasOwnProperty.call(targetKeys, key) && !Object.prototype.hasOwnProperty.call(sourceKeys, key)) {
      console.warn(`  [WARNING] Unused key in '${targetLocale}.json': '${key}'`);
    }
  }
  
  if (!hasErrors) {
    console.log(`  '${targetLocale}.json' is clean.`);
  }
}

/**
 * Checks if all translation values are strings.
 * @param {object} keys Object of keys to check.
 * @param {string} locale The name of the locale.
 * @returns {boolean} True if no errors were found, false otherwise.
 */
function checkKeyTypes(keys, locale) {
  let isValid = true;
  for (const key in keys) {
    if (Object.prototype.hasOwnProperty.call(keys, key)) {
      if (typeof keys[key] !== 'string') {
        console.error(`  [ERROR] Key '${key}' in '${locale}.json' has a non-string value. Type: ${typeof keys[key]}`);
        isValid = false;
      }
    }
  }
  return isValid;
}

// =================================================================
// Main Script
// =================================================================

function checkTranslations() {
  console.log('======================================');
  console.log(' Running Translation Integrity Check ');
  console.log('======================================\n');
  
  // Load source locale
  const sourcePath = path.join(config.localesDir, `${config.sourceLocale}.json`);
  const sourceTranslations = loadTranslations(sourcePath);

  if (!sourceTranslations) {
    console.error(`Aborting: Could not load source locale file '${config.sourceLocale}.json'`);
    return;
  }

  // Find all used keys in the source code
  console.log('Collecting keys from source code...');
  const usedKeys = collectAllKeys(config.sourceCodeDir);
  console.log(`Found ${usedKeys.size} keys in total.`);
  console.log('--------------------------------------\n');
  
  // Check the source locale file itself
  console.log(`Checking source locale file: '${config.sourceLocale}.json'`);
  if (!checkKeyTypes(sourceTranslations, config.sourceLocale)) {
      console.error(`\nSource locale file '${config.sourceLocale}.json' has type errors. Please fix them.`);
      return;
  }
  
  for (const key of Object.keys(sourceTranslations)) {
      if (!usedKeys.has(key)) {
          console.warn(`  [WARNING] Unused key in source locale: '${key}'`);
      }
  }
  console.log(`\nSource locale file '${config.sourceLocale}.json' is valid.`);
  console.log('--------------------------------------\n');

  // Load and check other locale files
  const otherLocaleFiles = fs.readdirSync(config.localesDir)
    .filter(file => file.endsWith('.json') && !file.startsWith(config.sourceLocale));

  otherLocaleFiles.forEach(file => {
    const localeName = file.split('.')[0];
    const filePath = path.join(config.localesDir, file);
    const translations = loadTranslations(filePath);

    if (translations) {
      if (checkKeyTypes(translations, localeName)) {
        checkKeysExist(sourceTranslations, translations, localeName, usedKeys);
      } else {
        console.error(`\nAborting check for '${localeName}.json' due to type errors.`);
      }
      console.log('--------------------------------------\n');
    }
  });
  
  console.log('Translation check finished.');
}

checkTranslations();
