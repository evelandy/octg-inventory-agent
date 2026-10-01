import { QueryTypes } from 'sequelize';
import { sequelize } from '../db/connection.js';

try {
  await sequelize.authenticate();
  const rows = await sequelize.query<{ version: string }>('SELECT version() AS version;', {
    type: QueryTypes.SELECT,
  });
  console.log('✅ Connected to Postgres');
  console.log(`   ${rows[0]?.version}`);
} catch (err) {
  console.error('❌ Could not connect:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
