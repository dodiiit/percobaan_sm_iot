# Adding Translations to the IndoWater Application

This guide explains how to add new translations to the IndoWater application.

## Overview

The application uses i18next for internationalization and currently supports two languages:
- English (en)
- Indonesian (id)

## Translation Files

Translation files are located in:
```
/public/locales/[language_code]/translation.json
```

## Adding a New Translation Key

1. Identify the text that needs to be translated
2. Add the key to both language files:
   - `/public/locales/en/translation.json`
   - `/public/locales/id/translation.json`
3. Use a hierarchical structure with dot notation for organization

Example:
```json
// English (en/translation.json)
{
  "meters": {
    "newKey": "English text"
  }
}

// Indonesian (id/translation.json)
{
  "meters": {
    "newKey": "Indonesian text"
  }
}
```

## Using Translations in Components

1. Import the translation hook:
```tsx
import { useTranslation } from 'react-i18next';
```

2. Initialize the hook in your component:
```tsx
const { t } = useTranslation();
```

3. Use the translation function:
```tsx
<h1>{t('meters.newKey')}</h1>
```

## Translation with Variables

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

## Checking for Missing Translations

Run the translation checker script to find missing or empty translations:

```bash
npm run check-translations
```

## Best Practices

1. **Use Namespaces**: Organize translations with namespaces (e.g., `common.save`, `auth.login.title`)
2. **Keep Keys Simple**: Use descriptive but concise keys
3. **Avoid Hardcoded Strings**: Always use the translation function for user-visible text
4. **Check for Missing Translations**: Run the checker script regularly
5. **Test Both Languages**: Always test the application in all supported languages

## Common Namespaces

The application uses the following common namespaces:

- `app`: Application-wide texts (title, tagline)
- `common`: Common UI elements (buttons, labels)
- `auth`: Authentication-related texts
- `dashboard`: Dashboard-related texts
- `meters`: Meter-related texts
- `customers`: Customer-related texts
- `payments`: Payment-related texts
- `settings`: Settings-related texts
- `profile`: Profile-related texts
- `errors`: Error messages
- `success`: Success messages
- `validation`: Form validation messages

## Language Selector Component

The application includes a reusable `LanguageSelector` component that can be used to allow users to switch languages:

```tsx
import LanguageSelector from '../components/common/LanguageSelector';

// In your component:
<LanguageSelector variant="icon" />
```

The component supports three variants:
- `icon`: Shows only an icon
- `text`: Shows the language code
- `full`: Shows the language name with a flag