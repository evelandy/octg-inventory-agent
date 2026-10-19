-- Read-only. Run from server/:  npm run seed:check

-- "Overdue" == latest inspection more than 12 months before the anchor date (2026-10-01),
-- i.e. before 2025-10-01, OR no inspections at all.

\echo
\echo '== Seed checks (every row should say PASS)'
WITH
totals AS (SELECT count(*)::numeric AS joints FROM joints),
latest AS (
  SELECT joint_id, max(inspected_at) AS last_inspected_at, count(*) AS n
  FROM inspections GROUP BY joint_id
),
per_yard_racks AS (
  SELECT y.id, count(r.id) AS racks FROM yards y LEFT JOIN racks r ON r.yard_id = y.id GROUP BY y.id
),
per_mill_heats AS (
  SELECT m.id, count(h.id) AS heats FROM mills m LEFT JOIN heats h ON h.mill_id = m.id GROUP BY m.id
),
spec_stock AS (
  SELECT ps.id, count(j.id) AS on_hand, count(j.id) FILTER (WHERE j.status = 'available') AS available
  FROM pipe_specs ps LEFT JOIN joints j ON j.pipe_spec_id = ps.id GROUP BY ps.id
),
spec_yards_available AS (
  SELECT j.pipe_spec_id, count(DISTINCT r.yard_id) AS yards
  FROM joints j JOIN racks r ON r.id = j.rack_id
  WHERE j.status = 'available'
  GROUP BY j.pipe_spec_id
),
ref (product_type, od_in, weights, grades, connections) AS (VALUES
  ('casing',  4.500, ARRAY[9.50, 11.60, 13.50],        ARRAY['J55','L80','N80','P110'], ARRAY['STC','LTC','BTC']),
  ('casing',  5.500, ARRAY[15.50, 17.00, 20.00, 23.00], ARRAY['J55','L80','N80','P110'], ARRAY['STC','LTC','BTC']),
  ('casing',  7.000, ARRAY[23.00, 26.00, 29.00, 32.00], ARRAY['J55','L80','N80','P110'], ARRAY['STC','LTC','BTC']),
  ('casing',  9.625, ARRAY[36.00, 40.00, 47.00],        ARRAY['J55','K55','N80','L80'],  ARRAY['STC','LTC','BTC']),
  ('casing', 13.375, ARRAY[48.00, 54.50, 68.00],        ARRAY['J55','K55'],              ARRAY['STC','LTC','BTC']),
  ('casing', 20.000, ARRAY[94.00, 133.00],              ARRAY['J55','K55'],              ARRAY['STC','LTC','BTC']),
  ('tubing',  2.375, ARRAY[4.60, 4.70],                 ARRAY['J55','L80','N80','P110'], ARRAY['EUE','NUE']),
  ('tubing',  2.875, ARRAY[6.40, 6.50],                 ARRAY['J55','L80','N80','P110'], ARRAY['EUE','NUE']),
  ('tubing',  3.500, ARRAY[9.20, 9.30],                 ARRAY['J55','L80','N80'],        ARRAY['EUE','NUE']),
  ('production_casing', 4.500, ARRAY[11.60, 13.50, 15.10],        ARRAY['L80','N80','P110'],        ARRAY['STC','LTC','BTC']),
  ('production_casing', 5.000, ARRAY[15.00, 18.00, 21.40],        ARRAY['L80','P110','Q125'],       ARRAY['STC','LTC','BTC']),
  ('production_casing', 5.500, ARRAY[17.00, 20.00, 23.00, 26.00], ARRAY['L80','N80','P110','Q125'], ARRAY['STC','LTC','BTC']),
  ('production_casing', 7.000, ARRAY[26.00, 29.00, 32.00, 35.00], ARRAY['L80','N80','P110','T95'],  ARRAY['STC','LTC','BTC']),
  ('pup_joint', 2.375, ARRAY[4.70],         ARRAY['J55','L80','N80','P110'], ARRAY['EUE']),
  ('pup_joint', 2.875, ARRAY[6.50],         ARRAY['J55','L80','N80','P110'], ARRAY['EUE']),
  ('pup_joint', 3.500, ARRAY[9.30],         ARRAY['L80','N80'],              ARRAY['EUE']),
  ('pup_joint', 4.500, ARRAY[11.60, 13.50], ARRAY['L80','P110'],             ARRAY['LTC','BTC']),
  ('pup_joint', 5.500, ARRAY[17.00, 20.00], ARRAY['L80','P110'],             ARRAY['LTC','BTC']),
  ('pup_joint', 7.000, ARRAY[26.00, 29.00], ARRAY['L80','P110'],             ARRAY['LTC','BTC'])
),
spec_failures AS (
  SELECT ps.tag
  FROM pipe_specs ps
  WHERE NOT EXISTS (
          SELECT 1 FROM ref r
          WHERE r.product_type = ps.product_type::text
            AND r.od_in = ps.od_in
            AND ps.weight_per_ft = ANY (r.weights)
            AND ps.grade = ANY (r.grades)
            AND ps.connection = ANY (r.connections))
     OR (ps.product_type = 'pup_joint' AND NOT EXISTS (
          SELECT 1 FROM pipe_specs p
          WHERE p.product_type <> 'pup_joint'
            AND p.od_in = ps.od_in AND p.weight_per_ft = ps.weight_per_ft
            AND p.grade = ps.grade AND p.connection = ps.connection))
),
len_ranges (kind, length_range, min_ft, max_ft) AS (VALUES
  ('casing', 'R1', 16, 25), ('casing', 'R2', 25, 34), ('casing', 'R3', 34, 48),
  ('tubing', 'R1', 20, 24), ('tubing', 'R2', 28, 32), ('tubing', 'R3', 38, 42)
),
length_failures AS (
  SELECT j.serial_number
  FROM joints j
  JOIN pipe_specs ps ON ps.id = j.pipe_spec_id
  LEFT JOIN len_ranges lr
    ON lr.kind = CASE WHEN ps.product_type = 'tubing' THEN 'tubing' ELSE 'casing' END
   AND lr.length_range = ps.length_range::text
  WHERE CASE
          WHEN ps.product_type = 'pup_joint' THEN j.length_ft NOT IN (2, 4, 6, 8, 10, 12)
          ELSE lr.length_range IS NULL OR j.length_ft NOT BETWEEN lr.min_ft AND lr.max_ft
        END
),
status_pct AS (
  SELECT status, round(100 * count(*) / (SELECT joints FROM totals), 1) AS pct FROM joints GROUP BY status
),
checks (ac, check_name, actual, target, ok) AS (
            SELECT 'AC3', 'yards', count(*)::text, '3–4', count(*) BETWEEN 3 AND 4 FROM yards
  UNION ALL SELECT 'AC3', 'racks per yard', min(racks) || '–' || max(racks), '2–4', min(racks) >= 2 AND max(racks) <= 4 FROM per_yard_racks
  UNION ALL SELECT 'AC3', 'racks in total', sum(racks)::text, 'about 10 (8–12)', sum(racks) BETWEEN 8 AND 12 FROM per_yard_racks
  UNION ALL SELECT 'AC3', 'pipe specs', count(*)::text, '30', count(*) = 30 FROM pipe_specs
  UNION ALL SELECT 'AC3', 'mills', count(*)::text, '3–4', count(*) BETWEEN 3 AND 4 FROM mills
  UNION ALL SELECT 'AC3', 'heats per mill', min(heats) || '–' || max(heats), '2–3', min(heats) >= 2 AND max(heats) <= 3 FROM per_mill_heats
  UNION ALL SELECT 'AC3', 'joints', joints::text, '150–300', joints BETWEEN 150 AND 300 FROM totals
  UNION ALL SELECT 'AC3', 'joints with 1–3 inspections',
                   round(100 * (SELECT count(*) FROM latest WHERE n BETWEEN 1 AND 3) / joints, 1) || '%', 'most (≥ 90%)',
                   (SELECT count(*) FROM latest WHERE n BETWEEN 1 AND 3) >= 0.9 * joints FROM totals
  UNION ALL SELECT 'AC3', 'most inspections on one joint', coalesce(max(n), 0)::text, '≤ 3', coalesce(max(n), 0) <= 3 FROM latest
  UNION ALL SELECT 'AC4', 'available', coalesce(max(pct) FILTER (WHERE status = 'available'), 0) || '%', 'most (60–85%)',
                   coalesce(max(pct) FILTER (WHERE status = 'available'), 0) BETWEEN 60 AND 85 FROM status_pct
  UNION ALL SELECT 'AC4', 'reserved', coalesce(max(pct) FILTER (WHERE status = 'reserved'), 0) || '%', 'about 15% (10–20%)',
                   coalesce(max(pct) FILTER (WHERE status = 'reserved'), 0) BETWEEN 10 AND 20 FROM status_pct
  UNION ALL SELECT 'AC4', 'quarantined', coalesce(max(pct) FILTER (WHERE status = 'quarantined'), 0) || '%', 'about 10% (6–14%)',
                   coalesce(max(pct) FILTER (WHERE status = 'quarantined'), 0) BETWEEN 6 AND 14 FROM status_pct
  UNION ALL SELECT 'AC4', 'specs on hand but none available', count(*)::text, '≥ 1', count(*) >= 1
                   FROM spec_stock WHERE on_hand > 0 AND available = 0
  UNION ALL SELECT 'AC4', 'specs with no joints', count(*)::text, 'several (≥ 3)', count(*) >= 3 FROM spec_stock WHERE on_hand = 0
  UNION ALL SELECT 'AC4', 'specs available in some yards but not all', count(*)::text, '≥ 1', count(*) >= 1
                   FROM spec_yards_available WHERE yards < (SELECT count(*) FROM yards)
  UNION ALL SELECT 'AC4', 'last inspected > 12 months ago',
                   round(100 * (SELECT count(*) FROM latest WHERE last_inspected_at < TIMESTAMPTZ '2025-10-01 00:00:00+00') / joints, 1) || '%',
                   '10–15%',
                   (SELECT count(*) FROM latest WHERE last_inspected_at < TIMESTAMPTZ '2025-10-01 00:00:00+00')
                     BETWEEN 0.10 * joints AND 0.15 * joints FROM totals
  UNION ALL SELECT 'AC4', '…of those, just over a year (12–14 months)', count(*)::text, 'a few (≥ 3)', count(*) >= 3
                   FROM latest WHERE last_inspected_at >= TIMESTAMPTZ '2025-08-01 00:00:00+00'
                                 AND last_inspected_at <  TIMESTAMPTZ '2025-10-01 00:00:00+00'
  UNION ALL SELECT 'AC4', 'never inspected',
                   round(100 * (joints - (SELECT count(*) FROM latest)) / joints, 1) || '%', 'about 5% (3–7%)',
                   joints - (SELECT count(*) FROM latest) BETWEEN 0.03 * joints AND 0.07 * joints FROM totals
  UNION ALL SELECT 'AC4', 'joints with no rack (in transit / at mill)', count(*)::text, 'a few (1–15)', count(*) BETWEEN 1 AND 15
                   FROM joints WHERE rack_id IS NULL
  UNION ALL SELECT 'AC4', 'available 5.5" 20# P110 in Houston Yard', count(*)::text, '≥ 1', count(*) >= 1
                   FROM joints j
                   JOIN pipe_specs ps ON ps.id = j.pipe_spec_id
                   JOIN racks r ON r.id = j.rack_id
                   JOIN yards y ON y.id = r.yard_id
                   WHERE y.name = 'Houston Yard' AND j.status = 'available' AND ps.product_type <> 'pup_joint'
                     AND ps.od_in = 5.500 AND ps.weight_per_ft = 20.00 AND ps.grade = 'P110'
  UNION ALL SELECT 'AC5', 'specs failing the reference data', count(*)::text || coalesce(' (' || string_agg(tag, ', ') || ')', ''), '0', count(*) = 0
                   FROM spec_failures
  UNION ALL SELECT 'AC5', 'non-pup specs without an R1–R3 range', count(*)::text, '0', count(*) = 0
                   FROM pipe_specs WHERE product_type <> 'pup_joint' AND length_range IS NULL
  UNION ALL SELECT 'AC6', 'joints outside their length range', count(*)::text, '0', count(*) = 0 FROM length_failures
  UNION ALL SELECT 'AC7', 'yards not named after an oilfield hub', count(*)::text, '0', count(*) = 0
                   FROM yards WHERE name NOT IN ('Houston Yard', 'Midland Yard', 'Pleasanton Yard', 'Williston Yard')
)
SELECT ac, check_name, actual, target, CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END AS result
FROM checks;

\echo '== AC 2 fingerprint: run `npm run seed` again and confirm this value does not change'
SELECT md5(
  (SELECT string_agg(concat_ws('|', tag, product_type, od_in, weight_per_ft, grade, connection, length_range), ',' ORDER BY tag) FROM pipe_specs)
  || (SELECT string_agg(concat_ws('|', y.name, y.region, r.code), ',' ORDER BY y.name, r.code) FROM yards y JOIN racks r ON r.yard_id = y.id)
  || (SELECT string_agg(concat_ws('|', m.name, m.location, h.heat_number), ',' ORDER BY h.heat_number) FROM mills m JOIN heats h ON h.mill_id = m.id)
  || (SELECT string_agg(concat_ws('|', j.serial_number, ps.tag, h.heat_number, r.code, y.name, j.length_ft, j.status, j.location_state), ','
                        ORDER BY j.serial_number)
      FROM joints j
      JOIN pipe_specs ps ON ps.id = j.pipe_spec_id
      JOIN heats h ON h.id = j.heat_id
      LEFT JOIN racks r ON r.id = j.rack_id
      LEFT JOIN yards y ON y.id = r.yard_id)
  || (SELECT string_agg(concat_ws('|', j.serial_number, i.inspected_at AT TIME ZONE 'UTC', i.result, i.inspector, i.notes), ','
                        ORDER BY j.serial_number, i.inspected_at)
      FROM inspections i JOIN joints j ON j.id = i.joint_id)
) AS data_fingerprint;
