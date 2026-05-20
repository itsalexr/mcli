import { loadConfig } from '../src/config';

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.MONDAY_TOKEN;
    delete process.env.API_VERSION;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns config when MONDAY_TOKEN is set', () => {
    process.env.MONDAY_TOKEN = 'test-token-123';
    const config = loadConfig();
    expect(config.token).toBe('test-token-123');
    expect(config.apiVersion).toBe('2026-07');
    expect(config.endpoint).toBe('https://api.monday.com/v2');
  });

  it('throws when MONDAY_TOKEN is missing', () => {
    expect(() => loadConfig()).toThrow('MONDAY_TOKEN');
  });

  it('reads API_VERSION override when set', () => {
    process.env.MONDAY_TOKEN = 'test-token';
    process.env.API_VERSION = '2025-01';
    const config = loadConfig();
    expect(config.apiVersion).toBe('2025-01');
  });
});
