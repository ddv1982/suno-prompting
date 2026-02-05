// eslint.config.js
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import prettierConfig from 'eslint-config-prettier';

export default [
  // Ignore patterns - must be first
  {
    ignores: [
      'build/**',
      'artifacts/**',
      'node_modules/**',
      'src/main-ui/dist.css',
    ],
  },

  // Base TypeScript configuration with strict type checking and stylistic rules
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Language options for TypeScript files
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // React configuration for TSX files
  {
    files: ['**/*.tsx'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },

  // Import ordering for all TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      'import/order': [
        'error',
        {
          groups: [
            ['builtin', 'external'],
            'internal',
            ['parent', 'sibling', 'index'],
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },

  // Project-specific rules
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // TypeScript strict patterns
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/strict-boolean-expressions': 'off', // Too restrictive for React patterns

      // Non-null assertions forbidden in source code (tests have separate override)
      '@typescript-eslint/no-non-null-assertion': 'error',
      // Template literals with numbers are safe and readable
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowNumber: true,
          allowBoolean: true,
          allowNullish: false,
        },
      ],
      // Async functions without await are used for interface consistency (returning Promise)
      '@typescript-eslint/require-await': 'off',
      // Unnecessary conditions/optional chains are defensive coding patterns
      '@typescript-eslint/no-unnecessary-condition': 'off',
      // React onClick with async handlers and context properties are common patterns
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            attributes: false,
            properties: false,
          },
        },
      ],
      // All promises must be handled or explicitly voided
      '@typescript-eslint/no-floating-promises': 'error',
      // Redundant type constituents should be removed
      '@typescript-eslint/no-redundant-type-constituents': 'error',
      // Prefer ?? over || but allow || for strings (empty string is often treated as falsy intentionally)
      '@typescript-eslint/prefer-nullish-coalescing': [
        'error',
        {
          ignorePrimitives: { string: true },
        },
      ],

      // Code quality
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',

      // Complexity limits
      'max-lines-per-function': ['error', { max: 100, skipBlankLines: true, skipComments: true }],
      complexity: ['error', 15],
    },
  },

  // Scripts folder - allow console for CLI output
  {
    files: ['scripts/**/*.ts'],
    rules: {
      'no-console': 'off', // Scripts need console output
    },
  },

  // Logger file - allow all console methods
  {
    files: ['src/shared/logger.ts'],
    rules: {
      'no-console': 'off', // Logger needs console output
    },
  },

  // Test files - relaxed rules
  {
    files: ['tests/**/*.ts', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'max-lines-per-function': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      // Test mock functions return void, not Promise
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      // Non-null assertions are acceptable in tests where we control test data
      '@typescript-eslint/no-non-null-assertion': 'off',
      // Return types on test helpers are not critical
      '@typescript-eslint/explicit-function-return-type': 'off',
      // Allow console.info for benchmark and statistics output in tests
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      // Tests intentionally test deprecated functions for backward compatibility
      '@typescript-eslint/no-deprecated': 'off',
      // Empty functions are common for test mocks and stubs
      '@typescript-eslint/no-empty-function': 'off',
      // Tests may use || for falsy defaults intentionally
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
    },
  },

  // Type declaration files - these are ambient type definitions
  {
    files: ['src/types/**/*.ts'],
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // Prettier must be last to disable conflicting formatting rules
  prettierConfig,
];
