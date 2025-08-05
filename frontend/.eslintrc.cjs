module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: [
    'dist', 
    '.eslintrc.cjs', 
    'cypress/**/*', 
    'cypress.config.ts',
    'vite.config.ts',
    'src/setupTests.ts',
    'src/test-setup.ts',
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react-refresh', '@typescript-eslint', 'react'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // React rules
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'react/react-in-jsx-scope': 'off', // Not needed with React 17+
    'react/prop-types': 'off', // Using TypeScript for prop validation
    
    // TypeScript rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error', // Stricter than warn
    '@typescript-eslint/no-non-null-assertion': 'warn',
    
    // General code quality rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'no-duplicate-imports': 'error',
    'no-unused-expressions': 'error',
    
    // Import/export rules
    'sort-imports': ['error', { ignoreDeclarationSort: true }],
  },
};
