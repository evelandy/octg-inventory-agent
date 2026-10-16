import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import pg from 'pg';

// Rebuilds the octg_fixtures database: same migrations as the main database, plus hand-written data.

const FIXTURE_DB = 'octg_fixtures';
const serverDir = path.resolve(import.meta.dirname, '..', '..');

dotenv.config({ path: path.resolve(serverDir, '..', '.env'), quiet: true });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Check the .env file at the repo root.');
}

// Same server and credentials as DATABASE_URL, different database name
const fixtureUrl = new URL(databaseUrl);
fixtureUrl.pathname = `/${FIXTURE_DB}`;

// 1. Recreate the database. A database can't drop itself, so connect to the main one to do it.
const admin = new pg.Client({ connectionString: databaseUrl });
await admin.connect();
try {
  await admin.query(`DROP DATABASE IF EXISTS ${FIXTURE_DB};`);
  await admin.query(`CREATE DATABASE ${FIXTURE_DB};`);
} finally {
  await admin.end();
}

// 2. Build the schema with the normal migrations. .sequelizerc's dotenv doesn't override an
//    existing variable, so this DATABASE_URL wins over the one in .env.
execFileSync('npx', ['sequelize-cli', 'db:migrate'], {
  cwd: serverDir,
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: fixtureUrl.toString() },
});

// 3. Load the hand-written rows
const sql = readFileSync(path.resolve(serverDir, 'src', 'db', 'fixtures', 'inventory-fixture.sql'), 'utf8');
const client = new pg.Client({ connectionString: fixtureUrl.toString() });
await client.connect();
try {
  await client.query(sql);
} finally {
  await client.end();
}

console.log(`✅ ${FIXTURE_DB} rebuilt with fixture data`);
