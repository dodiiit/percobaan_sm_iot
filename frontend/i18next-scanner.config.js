export default {
  input: [
    'src/**/*.{js,jsx,ts,tsx}',
    // Use ! to exclude files or directories
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/i18n.ts',
    '!**/node_modules/**',
  ],
  output: './public/locales/',
  options: {
    debug: true,
    func: {
      list: ['t', 'i18next.t', 'i18n.t', 'useTranslation().t'],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    trans: {
      component: 'Trans',
      i18nKey: 'i18nKey',
      defaultsKey: 'defaults',
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      fallbackKey: function(ns, value) {
        return value;
      },
    },
    lngs: ['en', 'id'],
    ns: ['translation'],
    defaultLng: 'en',
    defaultNs: 'translation',
    defaultValue: function(lng, ns, key) {
      if (lng === 'en') {
        return key;
      }
      return '';
    },
    resource: {
      loadPath: '{{lng}}/{{ns}}.json',
      savePath: '{{lng}}/{{ns}}.json',
      jsonIndent: 2,
      lineEnding: '\n',
    },
    nsSeparator: ':',
    keySeparator: '.',
    pluralSeparator: '_',
    contextSeparator: '_',
    contextDefaultValues: [],
    interpolation: {
      prefix: '{{',
      suffix: '}}',
    },
    removeUnusedKeys: false,
    sort: true,
  },
};