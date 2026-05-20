import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          strict: true,
          esModuleInterop: true,
          module: 'CommonJS',
          target: 'ES2022',
          moduleResolution: 'Node',
          skipLibCheck: true,
          resolveJsonModule: true,
        },
      },
    ],
  },
  clearMocks: true,
  resetMocks: true,
};

export default config;
