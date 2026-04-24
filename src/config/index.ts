import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');

dotenv.config({ path: envPath });

function getEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(getEnv('PORT', '4000')),
  databaseUrl: getEnv('DATABASE_URL', 'sqlite://./data/expenses.db'),
  logLevel: getEnv('LOG_LEVEL', 'info'),
};
