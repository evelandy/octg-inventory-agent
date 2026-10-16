-- Hand-written fixture data for the fixture golden queries (docs/golden-queries.md, Part 2).
-- Loaded into its own database (octg_fixtures) by `npm run db:fixtures`, so it never mixes with seeded data.
-- Every value is fixed: no Faker, no randomness. If you change a row here, update the expected answers.
--
-- What it deliberately includes (cases the Faker seed doesn't produce):
--   * the same heat number (H100) at two different mills
--   * joints with no rack: one in transit, one at the mill
--   * joints that have never been inspected
--   * a backdated inspection that is not the latest one
--   * a yard with no racks or joints
--   * one spec spread across two racks in the same yard

BEGIN;

INSERT INTO mills (name, location) VALUES
  ('Alpha Mill', 'Houston, TX'),
  ('Bravo Mill', 'Koppel, PA');

-- H100 exists at both mills (allowed: heat numbers are unique per mill)
INSERT INTO heats (mill_id, heat_number)
SELECT m.id, v.heat_number
FROM (VALUES ('Alpha Mill', 'H100'), ('Alpha Mill', 'H200'), ('Bravo Mill', 'H100')) AS v(mill, heat_number)
JOIN mills m ON m.name = v.mill;

INSERT INTO pipe_specs (product_type, od_in, weight_per_ft, grade, connection, length_range, tag) VALUES
  ('casing', 5.500, 17.00, 'L80', 'BTC', 'R3', 'CSG-5.5-17-L80'),
  ('casing', 9.625, 40.00, 'J55', 'BTC', 'R3', 'CSG-9.625-40-J55'),
  ('tubing', 2.875,  6.50, 'L80', 'EUE', 'R2', 'TBG-2.875-6.5-L80');

INSERT INTO yards (name, region) VALUES
  ('Fixture Houston Yard', 'Houston'),
  ('Fixture Midland Yard', 'Midland'),
  ('Fixture Odessa Yard',  'Odessa');   -- intentionally empty

INSERT INTO racks (yard_id, code)
SELECT y.id, v.code
FROM (VALUES ('Fixture Houston Yard', 'H-01'), ('Fixture Houston Yard', 'H-02'), ('Fixture Midland Yard', 'M-01')) AS v(yard, code)
JOIN yards y ON y.name = v.yard;

-- 12 joints. Yard and rack are NULL for joints that aren't on a rack.
INSERT INTO joints (serial_number, pipe_spec_id, heat_id, rack_id, length_ft, status, location_state)
SELECT v.serial, ps.id, h.id, r.id, v.length_ft,
       v.status::enum_joints_status, v.location_state::enum_joints_location_state
FROM (VALUES
  --  serial    spec tag              mill          heat    yard                    rack    length  status         location
  ('F-001', 'CSG-5.5-17-L80',    'Alpha Mill', 'H100', 'Fixture Houston Yard', 'H-01', 40.00, 'available',   'on_rack'),
  ('F-002', 'CSG-5.5-17-L80',    'Alpha Mill', 'H100', 'Fixture Houston Yard', 'H-01', 40.50, 'available',   'on_rack'),
  ('F-003', 'CSG-5.5-17-L80',    'Alpha Mill', 'H100', 'Fixture Houston Yard', 'H-01', 41.00, 'reserved',    'on_rack'),
  ('F-004', 'TBG-2.875-6.5-L80', 'Alpha Mill', 'H200', 'Fixture Houston Yard', 'H-01', 30.00, 'available',   'on_rack'),
  ('F-005', 'CSG-5.5-17-L80',    'Alpha Mill', 'H100', 'Fixture Houston Yard', 'H-02', 39.50, 'available',   'on_rack'),
  ('F-006', 'CSG-9.625-40-J55',  'Bravo Mill', 'H100', 'Fixture Houston Yard', 'H-02', 42.00, 'quarantined', 'on_rack'),
  ('F-007', 'TBG-2.875-6.5-L80', 'Alpha Mill', 'H200', 'Fixture Houston Yard', 'H-02', 31.25, 'available',   'on_rack'),
  ('F-008', 'CSG-5.5-17-L80',    'Bravo Mill', 'H100', 'Fixture Midland Yard', 'M-01', 40.00, 'available',   'on_rack'),
  ('F-009', 'TBG-2.875-6.5-L80', 'Bravo Mill', 'H100', 'Fixture Midland Yard', 'M-01', 30.50, 'quarantined', 'on_rack'),
  ('F-010', 'CSG-9.625-40-J55',  'Alpha Mill', 'H200', 'Fixture Midland Yard', 'M-01', 38.00, 'available',   'on_rack'),
  ('F-011', 'CSG-5.5-17-L80',    'Alpha Mill', 'H100', NULL,                   NULL,   40.25, 'reserved',    'in_transit'),
  ('F-012', 'TBG-2.875-6.5-L80', 'Bravo Mill', 'H100', NULL,                   NULL,   29.75, 'available',   'at_mill')
) AS v(serial, spec_tag, mill, heat_number, yard, rack, length_ft, status, location_state)
JOIN pipe_specs ps ON ps.tag = v.spec_tag
JOIN mills m       ON m.name = v.mill
JOIN heats h       ON h.mill_id = m.id AND h.heat_number = v.heat_number
LEFT JOIN yards y  ON y.name = v.yard
LEFT JOIN racks r  ON r.yard_id = y.id AND r.code = v.rack;

-- 12 inspections. F-004, F-007 and F-012 are never inspected.
INSERT INTO inspections (joint_id, inspected_at, result, inspector)
SELECT j.id, v.inspected_at::timestamptz, v.result::enum_inspections_result, v.inspector
FROM (VALUES
  ('F-001', '2026-03-01T10:00:00Z', 'pass', 'Fixture Inspector'),
  ('F-002', '2026-03-01T10:00:00Z', 'pass', 'Fixture Inspector'),
  ('F-002', '2026-06-15T10:00:00Z', 'fail', 'Fixture Inspector'),  -- latest is a fail, but the joint is still available
  ('F-003', '2026-04-10T10:00:00Z', 'pass', 'Fixture Inspector'),
  ('F-005', '2026-05-20T10:00:00Z', 'pass', 'Fixture Inspector'),
  ('F-006', '2026-02-01T10:00:00Z', 'pass', 'Fixture Inspector'),
  ('F-006', '2026-07-01T10:00:00Z', 'fail', 'Fixture Inspector'),
  ('F-008', '2026-08-01T10:00:00Z', 'pass', 'Fixture Inspector'),
  ('F-009', '2026-07-20T10:00:00Z', 'fail', 'Fixture Inspector'),
  ('F-010', '2026-06-01T10:00:00Z', 'pass', 'Fixture Inspector'),
  ('F-011', '2026-05-05T10:00:00Z', 'pass', 'Fixture Inspector'),
  ('F-008', '2026-01-15T10:00:00Z', 'fail', 'Backdated entry')     -- entered last, but older than F-008's pass
) AS v(serial, inspected_at, result, inspector)
JOIN joints j ON j.serial_number = v.serial;

-- INSERT ... SELECT silently skips rows whose lookup finds nothing (a misspelled tag or name),
-- so stop here if anything went missing.
DO $$
BEGIN
  IF (SELECT count(*) FROM joints) <> 12 THEN
    RAISE EXCEPTION 'Expected 12 fixture joints, found %', (SELECT count(*) FROM joints);
  END IF;
  IF (SELECT count(*) FROM inspections) <> 12 THEN
    RAISE EXCEPTION 'Expected 12 fixture inspections, found %', (SELECT count(*) FROM inspections);
  END IF;
END $$;

COMMIT;
