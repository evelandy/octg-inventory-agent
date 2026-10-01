'use strict';

// Tables that have an updated_at column. inspections is append-only, so it's not here.
const TABLES = ['mills', 'heats', 'pipe_specs', 'yards', 'racks', 'joints'];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // One shared function: stamp the row being updated with the current time
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // One trigger per table, all calling the same function
    for (const table of TABLES) {
      await queryInterface.sequelize.query(`
        CREATE TRIGGER trg_${table}_updated_at
          BEFORE UPDATE ON ${table}
          FOR EACH ROW
          EXECUTE FUNCTION set_updated_at();
      `);
    }
  },

  async down(queryInterface) {
    // Triggers first (they depend on the function), then the function
    for (const table of TABLES) {
      await queryInterface.sequelize.query(
        `DROP TRIGGER IF EXISTS trg_${table}_updated_at ON ${table};`
      );
    }
    await queryInterface.sequelize.query(`DROP FUNCTION IF EXISTS set_updated_at();`);
  },
};
