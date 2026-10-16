-- Golden queries: questions with known answers, used to check the data and the agent.
-- Expected answers and the dataset they belong to are recorded in docs/golden-queries.md.
--
-- Run all five (from the repo root) after reset + migrate + seed:
--   docker compose exec -T db psql -U octg -d octg_inventory -f - < server/src/db/golden-queries.sql
--
-- \echo is a psql command, so this file must be run with psql, not a GUI SQL editor.

\echo
\echo '== Q1. How many available joints of 9-5/8" 40# J55 casing are in the Houston yard, and how many feet?'
-- inventory_summary has one row per rack, so SUM across racks to get the yard total.
-- "Houston" is in yards.region, not yards.name.
SELECT SUM(s.joints) AS joints, SUM(s.total_footage) AS total_footage
FROM inventory_summary s
JOIN yards y ON y.id = s.yard_id
WHERE y.region LIKE 'Houston%'
  AND s.status = 'available'
  AND s.product_type = 'casing'
  AND s.od_in = 9.625
  AND s.weight_per_ft = 40.00
  AND s.grade = 'J55';

\echo '== Q2. How many joints and feet of each product type does each yard hold?'
-- Joints that aren't on a rack have no yard, so they are not part of this answer.
SELECT y.name AS yard, y.region, s.product_type,
       SUM(s.joints) AS joints, SUM(s.total_footage) AS total_footage
FROM inventory_summary s
JOIN yards y ON y.id = s.yard_id
GROUP BY y.name, y.region, s.product_type
ORDER BY y.name, s.product_type;

\echo '== Q3. How many joints are quarantined, and where are they?'
-- COALESCE labels joints with no yard (in transit / at mill) instead of showing a blank.
SELECT COALESCE(s.yard, '(not in a yard)') AS yard,
       SUM(s.joints) AS joints, SUM(s.total_footage) AS total_footage
FROM inventory_summary s
WHERE s.status = 'quarantined'
GROUP BY 1
ORDER BY 1;

\echo '== Q4. Which mill made heat H1789, and where are those joints now?'
-- Traceability: joint -> heat -> mill, plus where each joint is.
-- Heat numbers are unique per mill, so if two mills used H1789 both would appear.
SELECT m.name AS mill, y.name AS yard, r.code AS rack, j.location_state, COUNT(*) AS joints
FROM joints j
JOIN heats h      ON h.id = j.heat_id
JOIN mills m      ON m.id = h.mill_id
LEFT JOIN racks r ON r.id = j.rack_id
LEFT JOIN yards y ON y.id = r.yard_id
WHERE h.heat_number = 'H1789'
GROUP BY m.name, y.name, r.code, j.location_state
ORDER BY y.name, r.code;

\echo '== Q5. How many joints failed their most recent inspection, and how many of those are still marked available?'
-- "Most recent" comes from joint_latest_inspection (latest inspected_at, not entry order).
-- FILTER counts only the rows matching its condition, so one query gives both numbers.
SELECT COUNT(*)                                       AS failed_latest,
       COUNT(*) FILTER (WHERE j.status = 'available') AS still_available
FROM joint_latest_inspection li
JOIN joints j ON j.id = li.joint_id
WHERE li.last_result = 'fail';
