/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-explicit-any': 'off',
    'no-async-promise-executor': 'off',
  },
  overrides: [
    {
      // Context providers intentionally co-locate their consumer hooks
      // (ThemeProvider + useTheme, UIProvider + useUI, …) in one module.
      files: [
        'src/hooks/*.tsx',
        'src/store/*.tsx',
        'src/components/toast/*.tsx',
        'src/components/documents/*.tsx',
      ],
      rules: { 'react-refresh/only-export-components': 'off' },
    },
  ],
};
