import path from 'node:path';
import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

dotenv.config({ path: path.resolve(import.meta.dirname, '..', '..', '..', '.env'), quiet: true });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Check the .env file at the repo root.');
}

export const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
});
