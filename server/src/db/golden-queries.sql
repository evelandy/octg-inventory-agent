-- Known-answer queries for the seeded database (octg_inventory).
-- Expected results, and the dataset they belong to, are in docs/golden-queries.md.

-- Run all of them (from server/) after `npm run migrate && npm run seed`:
-- Docker compose exec -T db psql -U octg -d octg_inventory -f - < src/db/golden-queries.sql

-- \echo is a psql command, so this file must be run with psql, not a GUI SQL editor.

\echo
\echo '== Q1. How many joints of 5-1/2" 20# P110 are available in Houston Yard, and how many feet?'
-- Full-length pipe only, pup joints excluded.
SELECT SUM(s.joints) AS joints, SUM(s.total_footage) AS total_footage
FROM inventory_summary s
WHERE s.yard = 'Houston Yard'
  AND s.status = 'available'
  AND s.product_type <> 'pup_joint'
  AND s.od_in = 5.500
  AND s.weight_per_ft = 20.00
  AND s.grade = 'P110';

\echo '== Q2. How much 13-3/8" 54.5# J55 casing do we have on hand, and how much is available?'
SELECT COUNT(j.id) AS on_hand,
       COUNT(j.id) FILTER (WHERE j.status = 'available')   AS available,
       COUNT(j.id) FILTER (WHERE j.status = 'reserved')    AS reserved,
       COUNT(j.id) FILTER (WHERE j.status = 'quarantined') AS quarantined
FROM pipe_specs ps
LEFT JOIN joints j ON j.pipe_spec_id = ps.id
WHERE ps.product_type = 'casing' AND ps.od_in = 13.375 AND ps.weight_per_ft = 54.50 AND ps.grade = 'J55';

\echo '== Q3. Which yards have 3-1/2" 9.3# L80 tubing available, and which do not?'
-- Starts from yards. Tubing only, no pup joints.
SELECT y.name AS yard,
       COUNT(j.id) AS on_hand,
       COUNT(j.id) FILTER (WHERE j.status = 'available') AS available
FROM yards y
LEFT JOIN racks r ON r.yard_id = y.id
LEFT JOIN joints j ON j.rack_id = r.id
  AND j.pipe_spec_id IN (
    SELECT id FROM pipe_specs
    WHERE product_type = 'tubing' AND od_in = 3.500 AND weight_per_ft = 9.30 AND grade = 'L80')
GROUP BY y.name
ORDER BY y.name;

\echo '== Q4. How many joints are overdue for inspection, by yard?'
-- Overdue, with latest inspection before 2025-10-01 (12 months before the 2026-10-01 anchor), or never inspected.
WITH last_inspection AS (
  SELECT joint_id, MAX(inspected_at) AS last_inspected_at
  FROM inspections
  GROUP BY joint_id
)
SELECT COALESCE(y.name, '(not in a yard)') AS yard,
       COUNT(*) AS overdue,
       COUNT(*) FILTER (WHERE li.joint_id IS NULL) AS never_inspected,
       COUNT(*) FILTER (WHERE li.joint_id IS NOT NULL) AS last_inspected_over_12_months_ago
FROM joints j
LEFT JOIN last_inspection li ON li.joint_id = j.id
LEFT JOIN racks r ON r.id = j.rack_id
LEFT JOIN yards y ON y.id = r.yard_id
WHERE li.joint_id IS NULL
   OR li.last_inspected_at < DATE '2026-10-01' - INTERVAL '12 months'
GROUP BY 1
ORDER BY 1;

\echo '== Q5. Which heat and mill does joint J-00042 trace back to?'
SELECT j.serial_number, h.heat_number, m.name AS mill, m.location AS mill_location, ps.tag AS spec
FROM joints j
JOIN heats h      ON h.id = j.heat_id
JOIN mills m      ON m.id = h.mill_id
JOIN pipe_specs ps ON ps.id = j.pipe_spec_id
WHERE j.serial_number = 'J-00042';

\echo '== Q6. How many joints failed their most recent inspection, and how many of those are still marked available?'
SELECT COUNT(*)                                       AS failed_latest,
       COUNT(*) FILTER (WHERE j.status = 'available') AS still_available
FROM joint_latest_inspection li
JOIN joints j ON j.id = li.joint_id
WHERE li.last_result = 'fail';
