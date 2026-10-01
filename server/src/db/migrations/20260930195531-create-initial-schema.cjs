'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = () => Sequelize.literal('now()');
    const uuidPk = () => ({
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.literal('gen_random_uuid()'),
    });
    const timestamps = () => ({
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now() },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now() },
    });

    // 1. mills (no FKs)
    await queryInterface.createTable('mills', {
      id: uuidPk(),
      name: { type: Sequelize.TEXT, allowNull: false, unique: true },
      location: { type: Sequelize.TEXT },
      ...timestamps(),
    });

    // 2. heats (FK -> mills)
    await queryInterface.createTable('heats', {
      id: uuidPk(),
      mill_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'mills', key: 'id' },
      },
      heat_number: { type: Sequelize.TEXT, allowNull: false },
      ...timestamps(),
    });

    // heat number is unique *per mill*, not globally
    await queryInterface.addConstraint('heats', {
      fields: ['mill_id', 'heat_number'],
      type: 'unique',
      name: 'uq_heats_mill_heat_number',
    });

    // 3. pipe_specs (no FKs)
    await queryInterface.createTable('pipe_specs', {
      id: uuidPk(),
      product_type: {
        type: Sequelize.ENUM('casing', 'tubing'),
        allowNull: false, // no default: every spec must say which it is
      },
      od_in: { type: Sequelize.DECIMAL(6, 3), allowNull: false },          // e.g. 5.500
      weight_per_ft: { type: Sequelize.DECIMAL(6, 2), allowNull: false },  // lb/ft, e.g. 17.00
      grade: { type: Sequelize.TEXT, allowNull: false },                   // e.g. L80, P110
      connection: { type: Sequelize.TEXT, allowNull: false },              // e.g. BTC, LTC
      length_range: {
        type: Sequelize.ENUM('R1', 'R2', 'R3'),
        allowNull: false,
      },
      ...timestamps(),
    });

    // A spec is the *combination* of all six — no duplicate specs
    await queryInterface.addConstraint('pipe_specs', {
      fields: ['product_type', 'od_in', 'weight_per_ft', 'grade', 'connection', 'length_range'],
      type: 'unique',
      name: 'uq_pipe_specs_spec',
    });

    // 4. yards (no FKs)
    await queryInterface.createTable('yards', {
      id: uuidPk(),
      name: { type: Sequelize.TEXT, allowNull: false, unique: true },
      region: { type: Sequelize.TEXT },
      ...timestamps(),
    });

    // 5. racks (FK -> yards)
    await queryInterface.createTable('racks', {
      id: uuidPk(),
      yard_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'yards', key: 'id' },
      },
      code: { type: Sequelize.TEXT, allowNull: false },
      ...timestamps(),
    });

    // A rack number is unique *per yard*, not globally
    await queryInterface.addConstraint('racks', {
      fields: ['yard_id', 'code'],
      type: 'unique',
      name: 'uq_racks_yard_code',
    });

    // 6. joints (FK -> pipe_specs, heats, racks)
    await queryInterface.createTable('joints', {
      id: uuidPk(),
      serial_number: { type: Sequelize.TEXT, allowNull: false, unique: true },
      pipe_spec_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'pipe_specs', key: 'id' },
      },
      heat_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'heats', key: 'id' },
      },
      rack_id: {
        type: Sequelize.UUID, // nullable: no rack while in transit / at mill
        references: { model: 'racks', key: 'id' },
      },
      length_ft: { type: Sequelize.DECIMAL(6, 2), allowNull: false },
      status: {
        type: Sequelize.ENUM('available', 'reserved', 'quarantined'),
        allowNull: false,
        defaultValue: 'available',
      },
      location_state: {
        type: Sequelize.ENUM('on_rack', 'in_transit', 'at_mill'),
        allowNull: false, // no default: the caller must say where the joint is
      },
      ...timestamps(),
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE joints
        ADD CONSTRAINT ck_joints_length_positive
          CHECK (length_ft > 0),
        ADD CONSTRAINT ck_joints_rack_matches_location
          CHECK ((location_state = 'on_rack') = (rack_id IS NOT NULL));
    `);

    // 7. inspections (FK -> joints)
    await queryInterface.createTable('inspections', {
      id: uuidPk(),
      joint_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'joints', key: 'id' },
      },
      inspected_at: { type: Sequelize.DATE, allowNull: false }, // no default: must be the real date
      result: {
        type: Sequelize.ENUM('pass', 'fail'),
        allowNull: false,
      },
      inspector: { type: Sequelize.TEXT },
      notes: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: now() },
    });

    await queryInterface.addIndex('joints', ['pipe_spec_id', 'rack_id', 'status'], {
      name: 'idx_joints_spec_rack_status',
    });
    await queryInterface.addIndex('joints', ['heat_id'], { name: 'idx_joints_heat' });
    await queryInterface.addIndex('joints', ['rack_id'], { name: 'idx_joints_rack' });
    await queryInterface.sequelize.query(`
      CREATE INDEX idx_inspections_joint_recency
        ON inspections (joint_id, inspected_at DESC);
    `);

  },

  async down(queryInterface) {
    await queryInterface.dropTable('inspections');
    await queryInterface.dropTable('joints');
    await queryInterface.dropTable('racks');
    await queryInterface.dropTable('yards');
    await queryInterface.dropTable('pipe_specs');
    await queryInterface.dropTable('heats');
    await queryInterface.dropTable('mills');

    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_pipe_specs_product_type";
      DROP TYPE IF EXISTS "enum_pipe_specs_length_range";
      DROP TYPE IF EXISTS "enum_joints_status";
      DROP TYPE IF EXISTS "enum_joints_location_state";
      DROP TYPE IF EXISTS "enum_inspections_result";
    `);
  },

};
