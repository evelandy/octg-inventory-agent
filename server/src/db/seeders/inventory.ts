import path from 'node:path';
import dotenv from 'dotenv';
import pg from 'pg';
import { faker } from '@faker-js/faker';

faker.seed(100);

// Every date is calculated from ANCHOR, never from the real clock, so two runs produce identical data.
const ANCHOR = new Date('2026-10-01T00:00:00Z');
faker.setDefaultRefDate(ANCHOR);

const DAY_MS = 24 * 60 * 60 * 1000;
const daysBeforeAnchor = (days: number) => new Date(ANCHOR.getTime() - days * DAY_MS);
// Random date between maxDaysAgo and minDaysAgo before anchor date.
const dateBetweenDaysAgo = (maxDaysAgo: number, minDaysAgo: number) =>
    faker.date.between({ from: daysBeforeAnchor(maxDaysAgo), to: daysBeforeAnchor(minDaysAgo) });

dotenv.config({ path: path.resolve(import.meta.dirname, '..', '..', '..', '..', '.env'), quiet: true });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set. Check the .env file at the repo root.');
}
const pool = new pg.Pool({ connectionString: databaseUrl });

// Types 
type ProductType = 'casing' | 'tubing' | 'production_casing' | 'pup_joint';
type LengthRange = 'R1' | 'R2' | 'R3';
type JointStatus = 'available' | 'reserved' | 'quarantined';
type LocationState = 'on_rack' | 'in_transit' | 'at_mill';
type InspectionResult = 'pass' | 'fail';

type YardSeed = { name: string; region: string };
type RackSeed = { yard: string; code: string };
type MillSeed = { name: string; location: string };
type HeatSeed = { mill: string; heatNumber: string };
type SpecSeed = {
    tag: string;
    productType: ProductType;
    odIn: number;
    weightPerFt: number;
    grade: string;
    connection: string;
    lengthRange: LengthRange | null; // null only for pup joints
};
type JointSeed = {
    serial: string;
    specTag: string;
    heatNumber: string;
    rack: RackSeed | null; // null when in transit or at the mill
    lengthFt: number;
    status: JointStatus;
    locationState: LocationState;
};
type InspectionSeed = {
    serial: string;
    inspectedAt: Date;
    result: InspectionResult;
    inspector: string;
    notes: string;
};

// Reference data
const YARDS: YardSeed[] = [
    { name: 'Houston Yard', region: 'Gulf Coast' },
    { name: 'Midland Yard', region: 'Permian Basin' },
    { name: 'Pleasanton Yard', region: 'Eagle Ford' },
    { name: 'Williston Yard', region: 'Bakken' },
];

// 10 racks, 2–3 per yard.
const RACKS: RackSeed[] = [
    { yard: 'Houston Yard', code: 'A-01' },
    { yard: 'Houston Yard', code: 'A-02' },
    { yard: 'Houston Yard', code: 'B-01' },
    { yard: 'Midland Yard', code: 'A-01' },
    { yard: 'Midland Yard', code: 'A-02' },
    { yard: 'Midland Yard', code: 'B-03' },
    { yard: 'Pleasanton Yard', code: 'A-01' },
    { yard: 'Pleasanton Yard', code: 'B-01' },
    { yard: 'Williston Yard', code: 'A-01' },
    { yard: 'Williston Yard', code: 'B-02' },
];

const MILLS: MillSeed[] = [
    { name: 'Gulf Steel Tubular', location: 'Bay City, TX' },
    { name: 'Prairie Pipe Works', location: 'Tulsa, OK' },
    { name: 'Red River Tubulars', location: 'Shreveport, LA' },
    { name: 'Ironridge Steel', location: 'Youngstown, OH' },
];

// 10 heats, 2–3 per mill.
const HEATS: HeatSeed[] = [
    { mill: 'Gulf Steel Tubular', heatNumber: 'H24A1187' },
    { mill: 'Gulf Steel Tubular', heatNumber: 'H24A1203' },
    { mill: 'Gulf Steel Tubular', heatNumber: 'H24B0412' },
    { mill: 'Prairie Pipe Works', heatNumber: 'H23K0958' },
    { mill: 'Prairie Pipe Works', heatNumber: 'H24C2210' },
    { mill: 'Prairie Pipe Works', heatNumber: 'H24C2231' },
    { mill: 'Red River Tubulars', heatNumber: 'H24D0076' },
    { mill: 'Red River Tubulars', heatNumber: 'H24D0114' },
    { mill: 'Ironridge Steel', heatNumber: 'H23J1450' },
    { mill: 'Ironridge Steel', heatNumber: 'H24E0305' },
];

// 30 specs, each from a row of the reference tables (OD/weight pair, grade from that row, connection for the product type). Casing: STC/LTC/BTC. Tubing: EUE/NUE.
const SPECS: SpecSeed[] = [
    // Casing (surface/intermediate)
    { tag: 'CSG-4.5-11.6-J55-STC', productType: 'casing', odIn: 4.5, weightPerFt: 11.6, grade: 'J55', connection: 'STC', lengthRange: 'R3' },
    { tag: 'CSG-5.5-17-L80-LTC', productType: 'casing', odIn: 5.5, weightPerFt: 17, grade: 'L80', connection: 'LTC', lengthRange: 'R3' },
    { tag: 'CSG-5.5-23-N80-BTC', productType: 'casing', odIn: 5.5, weightPerFt: 23, grade: 'N80', connection: 'BTC', lengthRange: 'R3' },
    { tag: 'CSG-7-26-L80-BTC', productType: 'casing', odIn: 7, weightPerFt: 26, grade: 'L80', connection: 'BTC', lengthRange: 'R3' },
    { tag: 'CSG-7-32-N80-LTC', productType: 'casing', odIn: 7, weightPerFt: 32, grade: 'N80', connection: 'LTC', lengthRange: 'R2' },
    { tag: 'CSG-9.625-36-J55-STC', productType: 'casing', odIn: 9.625, weightPerFt: 36, grade: 'J55', connection: 'STC', lengthRange: 'R3' },
    { tag: 'CSG-9.625-40-L80-BTC', productType: 'casing', odIn: 9.625, weightPerFt: 40, grade: 'L80', connection: 'BTC', lengthRange: 'R3' },
    { tag: 'CSG-9.625-47-N80-LTC', productType: 'casing', odIn: 9.625, weightPerFt: 47, grade: 'N80', connection: 'LTC', lengthRange: 'R1' },
    { tag: 'CSG-13.375-54.5-J55-STC', productType: 'casing', odIn: 13.375, weightPerFt: 54.5, grade: 'J55', connection: 'STC', lengthRange: 'R3' },
    { tag: 'CSG-20-94-K55-BTC', productType: 'casing', odIn: 20, weightPerFt: 94, grade: 'K55', connection: 'BTC', lengthRange: 'R3' },

    // Tubing
    { tag: 'TBG-2.375-4.7-L80-EUE', productType: 'tubing', odIn: 2.375, weightPerFt: 4.7, grade: 'L80', connection: 'EUE', lengthRange: 'R2' },
    { tag: 'TBG-2.375-4.6-J55-NUE', productType: 'tubing', odIn: 2.375, weightPerFt: 4.6, grade: 'J55', connection: 'NUE', lengthRange: 'R2' },
    { tag: 'TBG-2.875-6.5-N80-EUE', productType: 'tubing', odIn: 2.875, weightPerFt: 6.5, grade: 'N80', connection: 'EUE', lengthRange: 'R2' },
    { tag: 'TBG-2.875-6.4-J55-NUE', productType: 'tubing', odIn: 2.875, weightPerFt: 6.4, grade: 'J55', connection: 'NUE', lengthRange: 'R1' },
    { tag: 'TBG-2.875-6.5-P110-EUE', productType: 'tubing', odIn: 2.875, weightPerFt: 6.5, grade: 'P110', connection: 'EUE', lengthRange: 'R2' },
    { tag: 'TBG-3.5-9.3-L80-EUE', productType: 'tubing', odIn: 3.5, weightPerFt: 9.3, grade: 'L80', connection: 'EUE', lengthRange: 'R2' },
    { tag: 'TBG-3.5-9.2-N80-EUE', productType: 'tubing', odIn: 3.5, weightPerFt: 9.2, grade: 'N80', connection: 'EUE', lengthRange: 'R3' },

    // Production casing
    { tag: 'PC-4.5-13.5-P110-BTC', productType: 'production_casing', odIn: 4.5, weightPerFt: 13.5, grade: 'P110', connection: 'BTC', lengthRange: 'R3' },
    { tag: 'PC-4.5-15.1-N80-LTC', productType: 'production_casing', odIn: 4.5, weightPerFt: 15.1, grade: 'N80', connection: 'LTC', lengthRange: 'R3' },
    { tag: 'PC-5-18-Q125-BTC', productType: 'production_casing', odIn: 5, weightPerFt: 18, grade: 'Q125', connection: 'BTC', lengthRange: 'R3' },
    { tag: 'PC-5.5-20-P110-BTC', productType: 'production_casing', odIn: 5.5, weightPerFt: 20, grade: 'P110', connection: 'BTC', lengthRange: 'R3' },
    { tag: 'PC-5.5-26-Q125-BTC', productType: 'production_casing', odIn: 5.5, weightPerFt: 26, grade: 'Q125', connection: 'BTC', lengthRange: 'R3' },
    { tag: 'PC-7-29-P110-LTC', productType: 'production_casing', odIn: 7, weightPerFt: 29, grade: 'P110', connection: 'LTC', lengthRange: 'R3' },
    { tag: 'PC-7-35-T95-BTC', productType: 'production_casing', odIn: 7, weightPerFt: 35, grade: 'T95', connection: 'BTC', lengthRange: 'R3' },

    // Pup joints
    { tag: 'PUP-2.375-4.7-L80-EUE', productType: 'pup_joint', odIn: 2.375, weightPerFt: 4.7, grade: 'L80', connection: 'EUE', lengthRange: null }, // TBG-2.375-4.7-L80-EUE
    { tag: 'PUP-2.875-6.5-N80-EUE', productType: 'pup_joint', odIn: 2.875, weightPerFt: 6.5, grade: 'N80', connection: 'EUE', lengthRange: null }, // TBG-2.875-6.5-N80-EUE
    { tag: 'PUP-3.5-9.3-L80-EUE', productType: 'pup_joint', odIn: 3.5, weightPerFt: 9.3, grade: 'L80', connection: 'EUE', lengthRange: null }, // TBG-3.5-9.3-L80-EUE
    { tag: 'PUP-4.5-13.5-P110-BTC', productType: 'pup_joint', odIn: 4.5, weightPerFt: 13.5, grade: 'P110', connection: 'BTC', lengthRange: null }, // PC-4.5-13.5-P110-BTC
    { tag: 'PUP-5.5-20-P110-BTC', productType: 'pup_joint', odIn: 5.5, weightPerFt: 20, grade: 'P110', connection: 'BTC', lengthRange: null }, // PC-5.5-20-P110-BTC
    { tag: 'PUP-7-26-L80-BTC', productType: 'pup_joint', odIn: 7, weightPerFt: 26, grade: 'L80', connection: 'BTC', lengthRange: null }, // CSG-7-26-L80-BTC
];

// Specs with no joints at all
const UNSTOCKED_TAGS = new Set([
    'CSG-4.5-11.6-J55-STC',
    'CSG-9.625-47-N80-LTC',
    'TBG-2.875-6.4-J55-NUE',
    'PC-4.5-15.1-N80-LTC',
    'PC-7-35-T95-BTC',
]);

// Specs where the joints are written only by the planted scenarios below, so random joints can never change those answers
const PLANTED_TAGS = new Set([
    'CSG-13.375-54.5-J55-STC', // all reserved or quarantined
    'TBG-3.5-9.3-L80-EUE', // available in Williston Yard only
    'PC-5.5-20-P110-BTC', // available in Houston Yard
]);

// Lengths
const LENGTH_RANGES: Record<'casing' | 'tubing', Record<LengthRange, { min: number; max: number }>> = {
    casing: { R1: { min: 16, max: 25 }, R2: { min: 25, max: 34 }, R3: { min: 34, max: 48 } },
    tubing: { R1: { min: 20, max: 24 }, R2: { min: 28, max: 32 }, R3: { min: 38, max: 42 } },
};
const PUP_LENGTHS = [2, 4, 6, 8, 10, 12];

function randomLength(spec: SpecSeed): number {
    if (spec.productType === 'pup_joint') {
        return faker.helpers.arrayElement(PUP_LENGTHS);
    }
    if (!spec.lengthRange) {
        throw new Error(`Spec ${spec.tag} needs a length range`);
    }
    const table = spec.productType === 'tubing' ? LENGTH_RANGES.tubing : LENGTH_RANGES.casing;
    const { min, max } = table[spec.lengthRange];
    return faker.number.float({ min, max, fractionDigits: 2 });
}

// Inspections: @5% never inspected; of the rest, @13% last inspected more than 12 months before the anchor date.
const INSPECTION_NOTES = [
    'Visual and drift inspection',
    'EMI inspection',
    'Thread and coupling inspection',
    'Full-length ultrasonic inspection',
];

function generateInspections(joint: JointSeed): InspectionSeed[] {
    const count = faker.helpers.weightedArrayElement([
        { weight: 5, value: 0 },
        { weight: 40, value: 1 },
        { weight: 35, value: 2 },
        { weight: 20, value: 3 },
    ]);
    if (count === 0) {
        return [];
    }

    const overdue = faker.datatype.boolean({ probability: 0.13 });
    let latest: Date;
    if (!overdue) {
        latest = dateBetweenDaysAgo(335, 15);
    } else if (faker.datatype.boolean()) {
        latest = dateBetweenDaysAgo(420, 370); // a little over a year old
    } else {
        latest = dateBetweenDaysAgo(900, 420);
    }

    // Older inspections.
    const dates = [latest];
    for (let k = 1; k < count; k++) {
        const previous = dates[dates.length - 1]!;
        dates.push(new Date(previous.getTime() - faker.number.int({ min: 60, max: 300 }) * DAY_MS));
    }

    return dates.map((inspectedAt, index) => {
        const isLatest = index === 0;
        const result: InspectionResult =
            isLatest && joint.status === 'quarantined'
                ? 'fail'
                : faker.helpers.weightedArrayElement<InspectionResult>([
                    { weight: 90, value: 'pass' },
                    { weight: 10, value: 'fail' },
                ]);
        return {
            serial: joint.serial,
            inspectedAt,
            result,
            inspector: faker.person.fullName(),
            notes: faker.helpers.arrayElement(INSPECTION_NOTES),
        };
    });
}

// Joints
const RANDOM_JOINT_COUNT = 220;

let serialCounter = 0;
const nextSerial = () => { 
    return `J-${String(++serialCounter).padStart(5, '0')}`; 
};

function findSpec(tag: string): SpecSeed {
    const spec = SPECS.find((s) => s.tag === tag);
    if (!spec) {
        throw new Error(`Unknown spec tag in seed data: ${tag}`);
    }
    return spec;
}

function findRack(yard: string, code: string): RackSeed {
    const rack = RACKS.find((r) => r.yard === yard && r.code === code);
    if (!rack) {
        throw new Error(`Unknown rack in seed data: ${yard} ${code}`);
    }
    return rack;
}

// Weighted random joints: @74% available, @15% reserved, @11% quarantined. A few in transit or at the mill with no rack.
function generateRandomJoints(): JointSeed[] {
    const pool = SPECS.filter((s) => !UNSTOCKED_TAGS.has(s.tag) && !PLANTED_TAGS.has(s.tag));
    const joints: JointSeed[] = [];
    for (let i = 0; i < RANDOM_JOINT_COUNT; i++) {
        const spec = faker.helpers.arrayElement(pool);
        const status = faker.helpers.weightedArrayElement<JointStatus>([
            { weight: 74, value: 'available' },
            { weight: 15, value: 'reserved' },
            { weight: 11, value: 'quarantined' },
        ]);
        const locationState = faker.helpers.weightedArrayElement<LocationState>([
            { weight: 98, value: 'on_rack' },
            { weight: 1, value: 'in_transit' },
            { weight: 1, value: 'at_mill' },
        ]);
        joints.push({
            serial: nextSerial(),
            specTag: spec.tag,
            heatNumber: faker.helpers.arrayElement(HEATS).heatNumber,
            rack: locationState === 'on_rack' ? faker.helpers.arrayElement(RACKS) : null,
            lengthFt: randomLength(spec),
            status,
            locationState,
        });
    }
    return joints;
}

// Planted scenarios
function plantJoints(specTag: string, yard: string, rackCode: string, statuses: JointStatus[]): JointSeed[] {
    const spec = findSpec(specTag);
    const rack = findRack(yard, rackCode);
    return statuses.map((status) => ({
        serial: nextSerial(),
        specTag,
        heatNumber: faker.helpers.arrayElement(HEATS).heatNumber,
        rack,
        lengthFt: randomLength(spec),
        status,
        locationState: 'on_rack' as const,
    }));
}

// Joints that are NOT on a rack. (In transit or at the mill)
function plantOffRackJoints(specTag: string, locationState: 'in_transit' | 'at_mill', statuses: JointStatus[]): JointSeed[] {
    const spec = findSpec(specTag);
    return statuses.map((status) => ({
        serial: nextSerial(),
        specTag,
        heatNumber: faker.helpers.arrayElement(HEATS).heatNumber,
        rack: null,
        lengthFt: randomLength(spec),
        status,
        locationState,
    }));
}

function generatePlantedJoints(): JointSeed[] {
    return [
        // 1. On hand > 0, available = 0: every joint is reserved or quarantined.
        ...plantJoints('CSG-13.375-54.5-J55-STC', 'Midland Yard', 'A-02',
            ['reserved', 'reserved', 'reserved', 'reserved', 'quarantined', 'quarantined']),

        // 2. Available in Williston Yard ONLY; Houston has some, but all reserved.
        ...plantJoints('TBG-3.5-9.3-L80-EUE', 'Williston Yard', 'A-01',
            ['available', 'available', 'available', 'available', 'available']),
        ...plantJoints('TBG-3.5-9.3-L80-EUE', 'Houston Yard', 'B-01', ['reserved', 'reserved', 'reserved']),

        // 3. Available 5.5" 20# P110 in Houston Yard (across two racks), some in Midland.
        ...plantJoints('PC-5.5-20-P110-BTC', 'Houston Yard', 'A-01',
            ['available', 'available', 'available', 'available']),
        ...plantJoints('PC-5.5-20-P110-BTC', 'Houston Yard', 'A-02', ['available', 'available', 'reserved']),
        ...plantJoints('PC-5.5-20-P110-BTC', 'Midland Yard', 'A-01', ['available', 'available', 'available']),

        // 4. On a truck to a rig: guarantees in_transit exists alongside the random at_mill joints
        ...plantOffRackJoints('CSG-9.625-40-L80-BTC', 'in_transit', ['reserved', 'reserved']),
    ];
}

// Insert everything into one transaction.
const rackKey = (yard: string, code: string) => `${yard}|${code}`;

async function seedInventory() {
    // Generate all data first, then insert. Generation order keeps runs identical.
    const joints = [...generateRandomJoints(), ...generatePlantedJoints()];
    const inspections = joints.flatMap(generateInspections);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Clear existing rows.
        await client.query('TRUNCATE inspections, joints, racks, heats, yards, mills, pipe_specs;');

        const yardIds = new Map<string, string>();
        for (const yard of YARDS) {
            const result = await client.query<{ id: string }>(
                'INSERT INTO yards (name, region) VALUES ($1, $2) RETURNING id;',
                [yard.name, yard.region],
            );
            yardIds.set(yard.name, result.rows[0]!.id);
        }

        const rackIds = new Map<string, string>();
        for (const rack of RACKS) {
            const yardId = yardIds.get(rack.yard);
            if (!yardId) throw new Error(`Rack ${rack.code}: unknown yard "${rack.yard}"`);
            const result = await client.query<{ id: string }>(
                'INSERT INTO racks (yard_id, code) VALUES ($1, $2) RETURNING id;',
                [yardId, rack.code],
            );
            rackIds.set(rackKey(rack.yard, rack.code), result.rows[0]!.id);
        }

        const millIds = new Map<string, string>();
        for (const mill of MILLS) {
            const result = await client.query<{ id: string }>(
                'INSERT INTO mills (name, location) VALUES ($1, $2) RETURNING id;',
                [mill.name, mill.location],
            );
            millIds.set(mill.name, result.rows[0]!.id);
        }

        const heatIds = new Map<string, string>();
        for (const heat of HEATS) {
            const millId = millIds.get(heat.mill);
            if (!millId) throw new Error(`Heat ${heat.heatNumber}: unknown mill "${heat.mill}"`);
            const result = await client.query<{ id: string }>(
                'INSERT INTO heats (mill_id, heat_number) VALUES ($1, $2) RETURNING id;',
                [millId, heat.heatNumber],
            );
            heatIds.set(heat.heatNumber, result.rows[0]!.id);
        }

        const specIds = new Map<string, string>();
        for (const spec of SPECS) {
            const result = await client.query<{ id: string }>(
                `INSERT INTO pipe_specs (product_type, od_in, weight_per_ft, grade, connection, length_range, tag)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;`,
                [spec.productType, spec.odIn, spec.weightPerFt, spec.grade, spec.connection, spec.lengthRange, spec.tag],
            );
            specIds.set(spec.tag, result.rows[0]!.id);
        }

        const jointIds = new Map<string, string>();
        for (const joint of joints) {
            const specId = specIds.get(joint.specTag);
            if (!specId) throw new Error(`${joint.serial}: unknown spec "${joint.specTag}"`);
            const heatId = heatIds.get(joint.heatNumber);
            if (!heatId) throw new Error(`${joint.serial}: unknown heat "${joint.heatNumber}"`);
            let rackId: string | null = null;
            if (joint.rack) {
                rackId = rackIds.get(rackKey(joint.rack.yard, joint.rack.code)) ?? null;
                if (!rackId) throw new Error(`${joint.serial}: unknown rack "${joint.rack.yard} ${joint.rack.code}"`);
            }
            const result = await client.query<{ id: string }>(
                `INSERT INTO joints (serial_number, pipe_spec_id, heat_id, rack_id, length_ft, status, location_state)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;`,
                [joint.serial, specId, heatId, rackId, joint.lengthFt, joint.status, joint.locationState],
            );
            jointIds.set(joint.serial, result.rows[0]!.id);
        }

        for (const inspection of inspections) {
            const jointId = jointIds.get(inspection.serial);
            if (!jointId) throw new Error(`Inspection for unknown joint "${inspection.serial}"`);
            await client.query(
                `INSERT INTO inspections (joint_id, inspected_at, result, inspector, notes)
         VALUES ($1, $2, $3, $4, $5);`,
                [jointId, inspection.inspectedAt, inspection.result, inspection.inspector, inspection.notes],
            );
        }

        await client.query('COMMIT');
        console.log(
            `Seeded ${YARDS.length} yards, ${RACKS.length} racks, ${MILLS.length} mills, ${HEATS.length} heats, ` +
            `${SPECS.length} specs, ${joints.length} joints, ${inspections.length} inspections`,
        );
    } catch (error) {
        // Undo everything including the TRUNCATE from this run.
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

try {
    await seedInventory();
} catch (error) {
    console.error('Seeding failed; no changes were saved:', error);
    process.exitCode = 1;
} finally {
    await pool.end();
}
