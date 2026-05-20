import * as dotenv from 'dotenv';

dotenv.config();

export interface Config {
  token: string;
  apiVersion: string;
  endpoint: string;
}

export function loadConfig(): Config {
  const token = process.env.MONDAY_TOKEN;
  if (!token) {
    throw new Error(
      'MONDAY_TOKEN is required. Run `mcli auth login --token <TOKEN>` or set MONDAY_TOKEN in your .env file'
    );
  }
  return {
    token,
    apiVersion: process.env.API_VERSION ?? '2026-07',
    endpoint: 'https://api.monday.com/v2',
  };
}
