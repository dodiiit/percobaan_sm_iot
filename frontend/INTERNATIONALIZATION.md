# Internationalization (i18n) Guide

This document provides information about the internationalization setup in the IndoWater application.

## Overview

The application uses [i18next](https://www.i18next.com/) for internationalization, with the following features:

- Support for multiple languages (currently English and Indonesian)
- Translation files stored in JSON format
- Language detection and persistence
- Language switching functionality
- Translation key extraction tool

## Directory Structure

```
frontend/
├── public/
│   └── locales/
│       ├── en/
│       │   └── translation.json
│       └── id/
│           └── translation.json
├── src/
│   ├── i18n.ts                      # i18next configuration
│   ├── contexts/
│   │   └── LanguageContext.tsx      # Language context provider
│   └── components/
│       └── common/
│           └── LanguageSelector.tsx # Language selector component
└── scripts/
    └── check-translations.js        # Script to check for missing translations
```

## Usage

### Basic Translation

To translate text in your components, use the `useTranslation` hook:

```tsx
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('page.title')}</h1>
      <p>{t('page.description')}</p>
    </div>
  );
};
```

### Translation with Variables

You can include variables in your translations:

```tsx
// In your component
const { t } = useTranslation();
const username = 'John';

return <p>{t('welcome.message', { name: username })}</p>;

// In translation.json
{
  "welcome": {
    "message": "Welcome, {{name}}!"
  }
}
```

### Pluralization

For pluralization, use the count parameter:

```tsx
// In your component
const { t } = useTranslation();
const count = 5;

return <p>{t('items.count', { count })}</p>;

// In translation.json
{
  "items": {
    "count": "{{count}} item",
    "count_plural": "{{count}} items"
  }
}
```

### Changing Language

To change the language programmatically, use the `useLanguage` hook:

```tsx
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSwitcher = () => {
  const { language, changeLanguage } = useLanguage();
  
  return (
    <div>
      <button onClick={() => changeLanguage('en')}>English</button>
      <button onClick={() => changeLanguage('id')}>Bahasa Indonesia</button>
    </div>
  );
};
```

Alternatively, use the `LanguageSelector` component:

```tsx
import LanguageSelector from '../components/common/LanguageSelector';

const Header = () => {
  return (
    <header>
      <LanguageSelector variant="icon" />
    </header>
  );
};
```

## Translation Files

Translation files are located in `public/locales/{language}/translation.json`. Each file contains a hierarchical structure of translation keys and their corresponding values.

### Adding New Translations

1. Add the new key to `public/locales/en/translation.json` with the English text
2. Add the same key to `public/locales/id/translation.json` with the Indonesian translation

### Checking for Missing Translations

Run the translation checker script to find missing or empty translations:

```bash
npm run check-translations
```

### Extracting Translation Keys

To automatically extract translation keys from your code:

```bash
npm run i18n:extract
```

This will scan your source files for translation keys and update the translation files.

## Best Practices

1. **Use Namespaces**: Organize translations with namespaces (e.g., `common.save`, `auth.login.title`)
2. **Keep Keys Simple**: Use descriptive but concise keys
3. **Avoid Hardcoded Strings**: Always use the translation function for user-visible text
4. **Check for Missing Translations**: Run the checker script regularly
5. **Test Both Languages**: Always test the application in all supported languages

## Adding a New Language

To add a new language:

1. Create a new directory in `public/locales/` with the language code (e.g., `ja` for Japanese)
2. Copy `translation.json` from the English directory and translate all values
3. Add the language code to the supported languages list in `src/i18n.ts`
4. Add the language to the `LanguageSelector` component
5. Update the translation checker script to include the new language