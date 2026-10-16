-- Fixture golden queries: run against the octg_fixtures database (hand-written data, no Faker).
-- Expected answers are in docs/golden-queries.md, Part 2. They were worked out by hand from
-- src/db/fixtures/inventory-fixture.sql, so each one can be checked by reading that file.
--
-- Run all five (from the repo root) after `npm run db:fixtures`:
--   docker compose exec -T db psql -U octg -d octg_fixtures -f - < server/src/db/fixtures/golden-queries-fixture.sql

\echo
\echo '== F1. How many available joints of 5-1/2" 17# L80 casing are in the Houston yard, and how many feet?'
-- Spread over racks H-01 and H-02, so the per-rack rows must be summed.
-- Expected: 3 joints (F-001, F-002, F-005), 120.00 ft
SELECT SUM(s.joints) AS joints, SUM(s.total_footage) AS total_footage
FROM inventory_summary s
JOIN yards y ON y.id = s.yard_id
WHERE y.region LIKE 'Houston%'
  AND s.status = 'available'
  AND s.product_type = 'casing'
  AND s.od_in = 5.500
  AND s.weight_per_ft = 17.00
  AND s.grade = 'L80';

\echo '== F2. Which joints are not in a yard right now, and where are they?'
-- Joints with no rack have no yard; they must still show up.
-- Expected: F-011 in_transit, reserved, 40.25 ft; F-012 at_mill, available, 29.75 ft
SELECT j.serial_number, j.location_state, j.status, j.length_ft
FROM joints j
WHERE j.rack_id IS NULL
ORDER BY j.serial_number;

\echo '== F3. Which joints have never been inspected?'
-- LEFT JOIN keeps every joint; joints with no inspection have NULL on the inspection side.
-- Expected: F-004, F-007, F-012
SELECT j.serial_number
FROM joints j
LEFT JOIN inspections i ON i.joint_id = j.id
WHERE i.id IS NULL
ORDER BY j.serial_number;

\echo '== F4. Which mill made heat H100, and how many joints and feet came from it?'
-- H100 exists at two mills, so the honest answer has two rows.
-- Expected: Alpha Mill 5 joints, 201.25 ft; Bravo Mill 4 joints, 142.25 ft
SELECT m.name AS mill, COUNT(*) AS joints, SUM(j.length_ft) AS total_footage
FROM joints j
JOIN heats h ON h.id = j.heat_id
JOIN mills m ON m.id = h.mill_id
WHERE h.heat_number = 'H100'
GROUP BY m.name
ORDER BY m.name;

\echo '== F5. Which joints failed their most recent inspection, and what is their status now?'
-- F-008 has a fail, but it is a backdated entry older than its pass, so F-008 must NOT appear.
-- Expected: F-002 available; F-006 quarantined; F-009 quarantined
SELECT li.serial_number, j.status, li.last_inspected_at
FROM joint_latest_inspection li
JOIN joints j ON j.id = li.joint_id
WHERE li.last_result = 'fail'
ORDER BY li.serial_number;
