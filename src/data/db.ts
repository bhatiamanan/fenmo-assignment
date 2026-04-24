import fs from 'fs';
import path from 'path';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { config } from '../config/index.js';

export type ExpenseRow = {
  id: string;
  amount_cents: number;
  category: string;
  description: string;
  date: string;
  created_at: string;
  request_hash: string;
  idempotency_key: string | null;
};

export type DbSchema = {
  expenses: ExpenseRow[];
};

function resolveDatabasePath(databaseUrl: string) {
  if (databaseUrl.startsWith('file://')) {
    return path.resolve(process.cwd(), databaseUrl.replace('file://', ''));
  }
  if (databaseUrl.startsWith('sqlite://')) {
    return path.resolve(process.cwd(), databaseUrl.replace('sqlite://', ''));
  }
  return path.resolve(process.cwd(), databaseUrl);
}

const databaseFile = resolveDatabasePath(config.databaseUrl);
fs.mkdirSync(path.dirname(databaseFile), { recursive: true });

const adapter = new JSONFile<DbSchema>(databaseFile);
export const db = new Low<DbSchema>(adapter, { expenses: [] });

await db.read();
