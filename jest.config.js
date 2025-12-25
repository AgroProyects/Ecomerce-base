const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',

  // Module name mapping for absolute imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/actions/(.*)$': '<rootDir>/actions/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^@/schemas/(.*)$': '<rootDir>/schemas/$1',
  },

  // Collect coverage from these files
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'actions/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'schemas/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/dist/**',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 75,
      lines: 80,
    },
  },

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.{ts,tsx}',
    '**/*.{spec,test}.{ts,tsx}',
  ],

  // Transform files with ts-jest
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
      },
    }],
  },

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/out/',
    '<rootDir>/coverage/',
  ],

  // Transform node_modules that use ESM
  transformIgnorePatterns: [
    'node_modules/(?!(@faker-js)/)',
  ],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
