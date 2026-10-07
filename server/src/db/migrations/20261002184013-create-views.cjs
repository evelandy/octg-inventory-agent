'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Each joint's most recent inspection, by inspected_at (not entry order).
    await queryInterface.sequelize.query(`
      CREATE VIEW joint_latest_inspection AS
      SELECT DISTINCT ON (i.joint_id)
        i.joint_id,
        j.serial_number,
        i.inspected_at AS last_inspected_at,
        i.result       AS last_result,
        i.inspector    AS last_inspector
      FROM inspections i
      JOIN joints j ON j.id = i.joint_id
      ORDER BY i.joint_id, i.inspected_at DESC, i.created_at DESC;
    `);

    // LEFT JOINs keep joints with no rack (in transit / at mill); their yard and rack are NULL.
    await queryInterface.sequelize.query(`
      CREATE VIEW inventory_summary AS
      SELECT
        ps.id AS pipe_spec_id,
        ps.product_type, ps.od_in, ps.weight_per_ft, ps.grade, ps.connection, ps.length_range,
        y.id   AS yard_id,
        y.name AS yard,
        r.id   AS rack_id,
        r.code AS rack,
        j.location_state,
        j.status,
        COUNT(*)         AS joints,
        SUM(j.length_ft) AS total_footage
      FROM joints j
      JOIN pipe_specs ps ON ps.id = j.pipe_spec_id
      LEFT JOIN racks r  ON r.id  = j.rack_id
      LEFT JOIN yards y  ON y.id  = r.yard_id
      GROUP BY ps.id, ps.product_type, ps.od_in, ps.weight_per_ft, ps.grade, ps.connection,
               ps.length_range, y.id, y.name, r.id, r.code, j.location_state, j.status;
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`DROP VIEW IF EXISTS inventory_summary;`);
    await queryInterface.sequelize.query(`DROP VIEW IF EXISTS joint_latest_inspection;`);
  },
};
