'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Adding a CHECK validates every existing row; this fails if any row already breaks the rule.
    await queryInterface.sequelize.query(`
      ALTER TABLE pipe_specs
        ADD CONSTRAINT ck_pipe_specs_od_positive         CHECK (od_in > 0),
        ADD CONSTRAINT ck_pipe_specs_weight_positive     CHECK (weight_per_ft > 0),
        ADD CONSTRAINT ck_pipe_specs_grade_not_blank      CHECK (btrim(grade) <> ''),
        ADD CONSTRAINT ck_pipe_specs_connection_not_blank CHECK (btrim(connection) <> '');

      ALTER TABLE joints ADD CONSTRAINT ck_joints_serial_not_blank CHECK (btrim(serial_number) <> '');
      ALTER TABLE heats  ADD CONSTRAINT ck_heats_number_not_blank  CHECK (btrim(heat_number) <> '');
      ALTER TABLE racks  ADD CONSTRAINT ck_racks_code_not_blank    CHECK (btrim(code) <> '');
      ALTER TABLE mills  ADD CONSTRAINT ck_mills_name_not_blank    CHECK (btrim(name) <> '');
      ALTER TABLE yards  ADD CONSTRAINT ck_yards_name_not_blank    CHECK (btrim(name) <> '');
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE pipe_specs
        DROP CONSTRAINT IF EXISTS ck_pipe_specs_od_positive,
        DROP CONSTRAINT IF EXISTS ck_pipe_specs_weight_positive,
        DROP CONSTRAINT IF EXISTS ck_pipe_specs_grade_not_blank,
        DROP CONSTRAINT IF EXISTS ck_pipe_specs_connection_not_blank;

      ALTER TABLE joints DROP CONSTRAINT IF EXISTS ck_joints_serial_not_blank;
      ALTER TABLE heats  DROP CONSTRAINT IF EXISTS ck_heats_number_not_blank;
      ALTER TABLE racks  DROP CONSTRAINT IF EXISTS ck_racks_code_not_blank;
      ALTER TABLE mills  DROP CONSTRAINT IF EXISTS ck_mills_name_not_blank;
      ALTER TABLE yards  DROP CONSTRAINT IF EXISTS ck_yards_name_not_blank;
    `);
  },
};
