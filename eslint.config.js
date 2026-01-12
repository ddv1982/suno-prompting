// eslint.config.js
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';

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

  // Base TypeScript configuration with strict type checking
  ...tseslint.configs.strictTypeChecked,

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
        'warn',
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

      // Relaxed strict rules with justification:
      // Non-null assertions are used in music theory code where array lookups are guaranteed by math
      '@typescript-eslint/no-non-null-assertion': 'warn',
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
      // Some fire-and-forget promises are intentional (initial loads, effects)
      '@typescript-eslint/no-floating-promises': 'warn',
      // Redundant type constituents are sometimes useful for documentation
      '@typescript-eslint/no-redundant-type-constituents': 'warn',

      // Code quality
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',

      // Complexity limits
      'max-lines-per-function': ['warn', { max: 100, skipBlankLines: true, skipComments: true }],
      complexity: ['warn', 15],
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
];
