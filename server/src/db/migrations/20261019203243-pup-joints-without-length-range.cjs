'use strict';

// Pup joints are short pieces (2–12 ft) with no API length range, so their specs store NULL.
// Every other product type must still have R1–R3. Same "one column decides the other" pattern
// as ck_joints_rack_matches_location.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE pipe_specs ALTER COLUMN length_range DROP NOT NULL;

      ALTER TABLE pipe_specs
        ADD CONSTRAINT ck_pipe_specs_pup_has_no_length_range
          CHECK ((product_type = 'pup_joint') = (length_range IS NULL));
    `);
  },

  async down(queryInterface) {
    // SET NOT NULL fails while NULLs exist, so give pup specs a placeholder range first.
    // Without this, undoing on a seeded database would stop here.
    await queryInterface.sequelize.query(`
      ALTER TABLE pipe_specs DROP CONSTRAINT IF EXISTS ck_pipe_specs_pup_has_no_length_range;
      UPDATE pipe_specs SET length_range = 'R1' WHERE length_range IS NULL;
      ALTER TABLE pipe_specs ALTER COLUMN length_range SET NOT NULL;
    `);
  },
};
