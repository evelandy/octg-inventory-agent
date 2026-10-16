
import path from 'node:path';
import dotenv from 'dotenv';
import pg from 'pg';
import {faker} from '@faker-js/faker';

faker.seed(100);

dotenv.config({ path: path.resolve(import.meta.dirname, '..', '..', '..', '..', '.env'), quiet: true });

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
});

async function seedInventory() {
    console.log('Starting inventory seeding...');

    // faker data

    const casingCatalog = [
        {od: 4.500, weights: [9.50, 11.60, 13.50], grades: ['J55', 'L80', 'N80', 'P110']},
        {od: 5.500, weights: [15.50, 17.00, 20.00, 23.00], grades: ['J55', 'L80', 'N80', 'P110']},
        {od: 7.000, weights: [23.00, 26.00, 29.00, 32.00], grades: ['J55', 'L80', 'N80', 'P110']},
        {od: 9.625, weights: [36.00, 40.00, 47.00], grades: ['J55', 'L80', 'N80', 'K55']},
        {od: 13.375, weights: [48.00, 54.50, 68.00], grades: ['J55', 'K55']},
        {od: 20.000, weights: [94.00, 133.00], grades: ['J55', 'K55']},
    ];

    const productionCasingCatalog = [
        {od: 4.500, weights: [11.60, 13.50, 15.10], grades: ['L80', 'N80', 'P110']},
        {od: 5.000, weights: [15.00, 18.00, 21.40], grades: ['L80', 'P110', 'Q125']},
        {od: 5.500, weights: [17.00, 20.00, 23.00, 26.00], grades: ['L80', 'N80', 'P110', 'Q125']},
        {od: 7.000, weights: [26.00, 29.00, 32.00, 35.00], grades: ['L80', 'N80', 'P110', 'T95']},
    ];

    const tubingCatalog = [
        {od: 2.375, weights: [4.60, 4.70], grades: ['J55', 'L80', 'N80', 'P110']},
        {od: 2.875, weights: [6.40, 6.50], grades: ['J55', 'L80', 'N80', 'P110']},
        {od: 3.500, weights: [9.20, 9.30], grades: ['J55', 'L80', 'N80']},
    ];

    const pupJointCatalog = [
        {type: 'tubing', od: 2.375, weights: [4.70], grades: ['J55', 'L80', 'N80', 'P110']},
        {type: 'tubing', od: 2.875, weights: [6.50], grades: ['J55', 'L80', 'N80', 'P110']},
        {type: 'tubing', od: 3.500, weights: [9.30], grades: ['L80', 'N80']},
        {type: 'casing', od: 4.500, weights: [11.60, 13.50], grades: ['L80','P110']},
        {type: 'casing', od: 5.500, weights: [17.00, 20.00], grades: ['L80','P110']},
        {type: 'casing', od: 7.000, weights: [26.00, 29.00], grades: ['L80','P110']},
    ];

    const lengthRangeCatalog = [
        {type: 'R1', casing: {min: 10, max: 20}},
        {type: 'R2', casing: {min: 28, max: 32}},
        {type: 'R3', casing: {min: 38, max: 42}},
    ];

    let sharedCatalog:any = {};
    // shared catalog that all pipe specs will use
    for(let i = 0; i < 8; i++) {
        sharedCatalog[`sharedSpec${i}`] = {
            connection: faker.lorem.word(5),
            length_range: faker.helpers.arrayElement(lengthRangeCatalog).type,
            tag: faker.lorem.word(5)
        };
    }

    // console.log(`Shared Catalog: ${JSON.stringify(sharedCatalog)}`);

    let casingSpec:any = {};
    let prodCasingSpec:any = {};
    let tubingSpec:any = {};
    let pupJointSpec:any = {};

    // Generate random catalog specs for all 4 types
    // const casingSpecs = faker.helpers.arrayElement(casingCatalog);
    // const prodCasingSpecs = faker.helpers.arrayElement(productionCasingCatalog);
    // const tubingSpecs = faker.helpers.arrayElement(tubingCatalog);
    // const pupJointSpecs = faker.helpers.arrayElement(pupJointCatalog);

    // 30 total catalog specs for all 4 types
    for(let i = 0; i < 8; i++) {
        const casingSpecs = faker.helpers.arrayElement(casingCatalog);
        casingSpec[`casingSpec${i}`] = {OD: casingSpecs.od, Weight: casingSpecs.weights[faker.number.int({ min: 0, max: casingSpecs.weights.length - 1 })], Grade: casingSpecs.grades[faker.number.int({ min: 0, max: casingSpecs.grades.length - 1 })]};
    }

    // console.log(`casingSpec: ${JSON.stringify(casingSpec["casingSpec7"])}`);

    for(let i = 0; i < 8; i++) {
        const prodCasingSpecs = faker.helpers.arrayElement(productionCasingCatalog);
        prodCasingSpec[`prodCasingSpec${i}`] = {OD: prodCasingSpecs.od, Weight: prodCasingSpecs.weights[faker.number.int({ min: 0, max: prodCasingSpecs.weights.length - 1 })], Grade: prodCasingSpecs.grades[faker.number.int({ min: 0, max: prodCasingSpecs.grades.length - 1 })]};
    }

    for(let i = 0; i < 7; i++) {
        const tubingSpecs = faker.helpers.arrayElement(tubingCatalog);
        tubingSpec[`tubingSpec${i}`] = {OD: tubingSpecs.od, Weight: tubingSpecs.weights[faker.number.int({ min: 0, max: tubingSpecs.weights.length - 1 })], Grade: tubingSpecs.grades[faker.number.int({ min: 0, max: tubingSpecs.grades.length - 1 })]};
    }

    for(let i = 0; i < 7; i++) {
        const pupJointSpecs = faker.helpers.arrayElement(pupJointCatalog);
        pupJointSpec[`pupJointSpec${i}`] = {OD: pupJointSpecs.od, Weight: pupJointSpecs.weights[faker.number.int({ min: 0, max: pupJointSpecs.weights.length - 1 })], Grade: pupJointSpecs.grades[faker.number.int({ min: 0, max: pupJointSpecs.grades.length - 1 })]};
    }

    // yard
    const yardsOpt:any = {};
    const yardName = ['Test Yard 1', 'Test Yard 2', 'Test Yard 3', 'Test Yard 4'];
    const yardRegion = ['Houston Yard (Gulf Coast)', 'Midland Yard (Permian Basin)', 'Pleasanton Yard (Eagle Ford)', 'Williston Yard (Bakken)'];
    for(let i = 0; i < 4; i++) {
        const randomYardName = faker.helpers.arrayElement(yardName);
        const randomYardRegion = faker.helpers.arrayElement(yardRegion);
        yardsOpt[`yard${i}`] = { name: randomYardName + `-${i + 1}`, region: randomYardRegion };
    }

    // mill
    const millsOpt:any = {};
    const millName = ['P2 Steel Works', 'Gulf Steel Tubular', 'Gulf Coast Piping', 'Permian Steel LLC'];
    const millLocation = ['Houston', 'Dallas', 'Austin', 'San Antonio'];
    for(let i = 0; i < 4; i++) {
        const randomMillName = faker.helpers.arrayElement(millName);
        const randomMillLocation = faker.helpers.arrayElement(millLocation);
        millsOpt[`mill${i}`] = { name: randomMillName + `-${i + 1}`, location: randomMillLocation };
    }

    // pipe specs
    const casingSpec0 = JSON.stringify(casingSpec["casingSpec0"]);
    const casingSpec1 = JSON.stringify(casingSpec["casingSpec1"]);
    const casingSpec2 = JSON.stringify(casingSpec["casingSpec2"]);
    const casingSpec3 = JSON.stringify(casingSpec["casingSpec3"]);
    const casingSpec4 = JSON.stringify(casingSpec["casingSpec4"]);
    const casingSpec5 = JSON.stringify(casingSpec["casingSpec5"]);
    const casingSpec6 = JSON.stringify(casingSpec["casingSpec6"]);
    const casingSpec7 = JSON.stringify(casingSpec["casingSpec7"]);

    const prodCasingSpec0 = JSON.stringify(prodCasingSpec["prodCasingSpec0"]);
    const prodCasingSpec1 = JSON.stringify(prodCasingSpec["prodCasingSpec1"]);
    const prodCasingSpec2 = JSON.stringify(prodCasingSpec["prodCasingSpec2"]);
    const prodCasingSpec3 = JSON.stringify(prodCasingSpec["prodCasingSpec3"]);
    const prodCasingSpec4 = JSON.stringify(prodCasingSpec["prodCasingSpec4"]);
    const prodCasingSpec5 = JSON.stringify(prodCasingSpec["prodCasingSpec5"]);
    const prodCasingSpec6 = JSON.stringify(prodCasingSpec["prodCasingSpec6"]);
    const prodCasingSpec7 = JSON.stringify(prodCasingSpec["prodCasingSpec7"]);

    const tubingSpec0 = JSON.stringify(tubingSpec["tubingSpec0"]);
    const tubingSpec1 = JSON.stringify(tubingSpec["tubingSpec1"]);
    const tubingSpec2 = JSON.stringify(tubingSpec["tubingSpec2"]);
    const tubingSpec3 = JSON.stringify(tubingSpec["tubingSpec3"]);
    const tubingSpec4 = JSON.stringify(tubingSpec["tubingSpec4"]);
    const tubingSpec5 = JSON.stringify(tubingSpec["tubingSpec5"]);
    const tubingSpec6 = JSON.stringify(tubingSpec["tubingSpec6"]);

    const pupJointSpec0 = JSON.stringify(pupJointSpec["pupJointSpec0"]);
    const pupJointSpec1 = JSON.stringify(pupJointSpec["pupJointSpec1"]);
    const pupJointSpec2 = JSON.stringify(pupJointSpec["pupJointSpec2"]);
    const pupJointSpec3 = JSON.stringify(pupJointSpec["pupJointSpec3"]);
    const pupJointSpec4 = JSON.stringify(pupJointSpec["pupJointSpec4"]);
    const pupJointSpec5 = JSON.stringify(pupJointSpec["pupJointSpec5"]);
    const pupJointSpec6 = JSON.stringify(pupJointSpec["pupJointSpec6"]);

    const sharedSpec0 = JSON.stringify(sharedCatalog["sharedSpec0"]);
    const sharedSpec1 = JSON.stringify(sharedCatalog["sharedSpec1"]);
    const sharedSpec2 = JSON.stringify(sharedCatalog["sharedSpec2"]);
    const sharedSpec3 = JSON.stringify(sharedCatalog["sharedSpec3"]);
    const sharedSpec4 = JSON.stringify(sharedCatalog["sharedSpec4"]);
    const sharedSpec5 = JSON.stringify(sharedCatalog["sharedSpec5"]);
    const sharedSpec6 = JSON.stringify(sharedCatalog["sharedSpec6"]);
    const sharedSpec7 = JSON.stringify(sharedCatalog["sharedSpec7"]);

    const combinedCasingSpec0 = Object.assign({}, JSON.parse(casingSpec0), JSON.parse(sharedSpec0));
    const combinedCasingSpec1 = Object.assign({}, JSON.parse(casingSpec1), JSON.parse(sharedSpec1));
    const combinedCasingSpec2 = Object.assign({}, JSON.parse(casingSpec2), JSON.parse(sharedSpec2));
    const combinedCasingSpec3 = Object.assign({}, JSON.parse(casingSpec3), JSON.parse(sharedSpec3));
    const combinedCasingSpec4 = Object.assign({}, JSON.parse(casingSpec4), JSON.parse(sharedSpec4));
    const combinedCasingSpec5 = Object.assign({}, JSON.parse(casingSpec5), JSON.parse(sharedSpec5));
    const combinedCasingSpec6 = Object.assign({}, JSON.parse(casingSpec6), JSON.parse(sharedSpec6));
    const combinedCasingSpec7 = Object.assign({}, JSON.parse(casingSpec7), JSON.parse(sharedSpec7));

    const combinedProdCasingSpec0 = Object.assign({}, JSON.parse(prodCasingSpec0), JSON.parse(sharedSpec0));
    const combinedProdCasingSpec1 = Object.assign({}, JSON.parse(prodCasingSpec1), JSON.parse(sharedSpec1));
    const combinedProdCasingSpec2 = Object.assign({}, JSON.parse(prodCasingSpec2), JSON.parse(sharedSpec2));
    const combinedProdCasingSpec3 = Object.assign({}, JSON.parse(prodCasingSpec3), JSON.parse(sharedSpec3));
    const combinedProdCasingSpec4 = Object.assign({}, JSON.parse(prodCasingSpec4), JSON.parse(sharedSpec4));
    const combinedProdCasingSpec5 = Object.assign({}, JSON.parse(prodCasingSpec5), JSON.parse(sharedSpec5));
    const combinedProdCasingSpec6 = Object.assign({}, JSON.parse(prodCasingSpec6), JSON.parse(sharedSpec6));
    const combinedProdCasingSpec7 = Object.assign({}, JSON.parse(prodCasingSpec7), JSON.parse(sharedSpec7));

    const combinedTubingSpec0 = Object.assign({}, JSON.parse(tubingSpec0), JSON.parse(sharedSpec0));
    const combinedTubingSpec1 = Object.assign({}, JSON.parse(tubingSpec1), JSON.parse(sharedSpec1));
    const combinedTubingSpec2 = Object.assign({}, JSON.parse(tubingSpec2), JSON.parse(sharedSpec2));
    const combinedTubingSpec3 = Object.assign({}, JSON.parse(tubingSpec3), JSON.parse(sharedSpec3));
    const combinedTubingSpec4 = Object.assign({}, JSON.parse(tubingSpec4), JSON.parse(sharedSpec4));
    const combinedTubingSpec5 = Object.assign({}, JSON.parse(tubingSpec5), JSON.parse(sharedSpec5));
    const combinedTubingSpec6 = Object.assign({}, JSON.parse(tubingSpec6), JSON.parse(sharedSpec6));

    const combinedPupJointSpec0 = Object.assign({}, JSON.parse(pupJointSpec0), JSON.parse(sharedSpec0));
    const combinedPupJointSpec1 = Object.assign({}, JSON.parse(pupJointSpec1), JSON.parse(sharedSpec1));
    const combinedPupJointSpec2 = Object.assign({}, JSON.parse(pupJointSpec2), JSON.parse(sharedSpec2));
    const combinedPupJointSpec3 = Object.assign({}, JSON.parse(pupJointSpec3), JSON.parse(sharedSpec3));
    const combinedPupJointSpec4 = Object.assign({}, JSON.parse(pupJointSpec4), JSON.parse(sharedSpec4));
    const combinedPupJointSpec5 = Object.assign({}, JSON.parse(pupJointSpec5), JSON.parse(sharedSpec5));
    const combinedPupJointSpec6 = Object.assign({}, JSON.parse(pupJointSpec6), JSON.parse(sharedSpec6));

    // heats
    const heatNumOpt:any = {};
    const heatNumArr = [
        "H1123",
        "H1456",
        "H1789",
        "H2123",
        "H2456",
        "H3123",
        "H3456",
        "H4123",
        "H4456",
        "H4789"
    ];
    for(let i = 0; i < 10; i++) {
        const randomHeat = faker.helpers.arrayElement(heatNumArr);
        heatNumOpt[i + 1] = randomHeat;
    };

    // racks
    const racksOpt:any = {};
    const rackCodesArr = [
        "A-01-1",
        "A-01-2",
        "A-01-3",
        "A-01-4",
        "B-01-1",
        "B-01-2",
        "B-01-3",
        "C-01-1",
        "C-01-2",
        "D-01-1"
    ];
    for(let i = 0; i < 10; i++) {
        const randomRack = faker.helpers.arrayElement(rackCodesArr);
        racksOpt[i + 1] = randomRack;
    }

    // joints
    // const jointz:any = [];
    // for(let i = 0; i < 40; i++) {
    //     for (let j = 0; j < 4; j++) {
    //         jointz.push({
    //         serial_number: `Test Joint ${i + 1}`,
    //         pipe_spec_name: `combinedCasingSpec${j}.tag`,
    //         product_type: 'casing',
    //         heat_name: heatNumOpt[i % heatNumOpt.length],
    //         rack_name: `racksOpt${j}.code`,
    //         length_ft: 20 + (i * 5),
    //         status: 'available',
    //         location_state: 'on_rack'
    //     })}
    // }

    // inspections
    
    const randomLength = (rangeType: string) => {
        const foundVal = lengthRangeCatalog.find(r => r.type === rangeType);
        // Without this, an unknown range gives NaN bounds -> a NaN length that Postgres accepts (NaN > 0 is true)
        if (!foundVal) throw new Error(`Unknown length range in seed data: ${rangeType}`);
        return faker.number.float({ min: foundVal.casing.min, max: foundVal.casing.max, fractionDigits: 2 });
    }


    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Clear existing rows
        console.log('Cleaning existing data...');
        await client.query(`
            TRUNCATE inspections, joints, racks, heats, yards, mills, pipe_specs;`);

        // 2. Define Seed Data
        const yards = [
            { name: yardsOpt.yard0.name, region: yardsOpt.yard0.region },
            { name: yardsOpt.yard1.name, region: yardsOpt.yard1.region },
            { name: yardsOpt.yard2.name, region: yardsOpt.yard2.region },
            { name: yardsOpt.yard3.name, region: yardsOpt.yard3.region },
        ];
        const yardIds = new Map<string, string>();

        const mills = [
            { name: millsOpt.mill0.name, location: millsOpt.mill0.location },
            { name: millsOpt.mill1.name, location: millsOpt.mill1.location },
            { name: millsOpt.mill2.name, location: millsOpt.mill2.location },
            { name: millsOpt.mill3.name, location: millsOpt.mill3.location },
        ];
        const millIds = new Map<string, string>();

        const pipe_specs = [
            { product_type: 'casing', od_in: combinedCasingSpec0.OD, weight_per_ft: combinedCasingSpec0.Weight, grade: combinedCasingSpec0.Grade, connection: combinedCasingSpec0.connection, length_range: combinedCasingSpec0.length_range, tag: combinedCasingSpec0.tag },
            { product_type: 'casing', od_in: combinedCasingSpec1.OD, weight_per_ft: combinedCasingSpec1.Weight, grade: combinedCasingSpec1.Grade, connection: combinedCasingSpec1.connection, length_range: combinedCasingSpec1.length_range, tag: combinedCasingSpec1.tag },
            { product_type: 'casing', od_in: combinedCasingSpec2.OD, weight_per_ft: combinedCasingSpec2.Weight, grade: combinedCasingSpec2.Grade, connection: combinedCasingSpec2.connection, length_range: combinedCasingSpec2.length_range, tag: combinedCasingSpec2.tag },
            { product_type: 'casing', od_in: combinedCasingSpec3.OD, weight_per_ft: combinedCasingSpec3.Weight, grade: combinedCasingSpec3.Grade, connection: combinedCasingSpec3.connection, length_range: combinedCasingSpec3.length_range, tag: combinedCasingSpec3.tag },
            { product_type: 'casing', od_in: combinedCasingSpec4.OD, weight_per_ft: combinedCasingSpec4.Weight, grade: combinedCasingSpec4.Grade, connection: combinedCasingSpec4.connection, length_range: combinedCasingSpec4.length_range, tag: combinedCasingSpec4.tag },
            { product_type: 'casing', od_in: combinedCasingSpec5.OD, weight_per_ft: combinedCasingSpec5.Weight, grade: combinedCasingSpec5.Grade, connection: combinedCasingSpec5.connection, length_range: combinedCasingSpec5.length_range, tag: combinedCasingSpec5.tag },
            { product_type: 'casing', od_in: combinedCasingSpec6.OD, weight_per_ft: combinedCasingSpec6.Weight, grade: combinedCasingSpec6.Grade, connection: combinedCasingSpec6.connection, length_range: combinedCasingSpec6.length_range, tag: combinedCasingSpec6.tag },
            { product_type: 'casing', od_in: combinedCasingSpec7.OD, weight_per_ft: combinedCasingSpec7.Weight, grade: combinedCasingSpec7.Grade, connection: combinedCasingSpec7.connection, length_range: combinedCasingSpec7.length_range, tag: combinedCasingSpec7.tag },

            { product_type: 'production_casing', od_in: combinedProdCasingSpec0.OD, weight_per_ft: combinedProdCasingSpec0.Weight, grade: combinedProdCasingSpec0.Grade, connection: combinedProdCasingSpec0.connection, length_range: combinedProdCasingSpec0.length_range, tag: "PC " + combinedProdCasingSpec0.tag },
            { product_type: 'production_casing', od_in: combinedProdCasingSpec1.OD, weight_per_ft: combinedProdCasingSpec1.Weight, grade: combinedProdCasingSpec1.Grade, connection: combinedProdCasingSpec1.connection, length_range: combinedProdCasingSpec1.length_range, tag: "PC " + combinedProdCasingSpec1.tag },
            { product_type: 'production_casing', od_in: combinedProdCasingSpec2.OD, weight_per_ft: combinedProdCasingSpec2.Weight, grade: combinedProdCasingSpec2.Grade, connection: combinedProdCasingSpec2.connection, length_range: combinedProdCasingSpec2.length_range, tag: "PC " + combinedProdCasingSpec2.tag },
            { product_type: 'production_casing', od_in: combinedProdCasingSpec3.OD, weight_per_ft: combinedProdCasingSpec3.Weight, grade: combinedProdCasingSpec3.Grade, connection: combinedProdCasingSpec3.connection, length_range: combinedProdCasingSpec3.length_range, tag: "PC " + combinedProdCasingSpec3.tag },
            { product_type: 'production_casing', od_in: combinedProdCasingSpec4.OD, weight_per_ft: combinedProdCasingSpec4.Weight, grade: combinedProdCasingSpec4.Grade, connection: combinedProdCasingSpec4.connection, length_range: combinedProdCasingSpec4.length_range, tag: "PC " + combinedProdCasingSpec4.tag },
            { product_type: 'production_casing', od_in: combinedProdCasingSpec5.OD, weight_per_ft: combinedProdCasingSpec5.Weight, grade: combinedProdCasingSpec5.Grade, connection: combinedProdCasingSpec5.connection, length_range: combinedProdCasingSpec5.length_range, tag: "PC " + combinedProdCasingSpec5.tag },
            { product_type: 'production_casing', od_in: combinedProdCasingSpec6.OD, weight_per_ft: combinedProdCasingSpec6.Weight, grade: combinedProdCasingSpec6.Grade, connection: combinedProdCasingSpec6.connection, length_range: combinedProdCasingSpec6.length_range, tag: "PC " + combinedProdCasingSpec6.tag },
            { product_type: 'production_casing', od_in: combinedProdCasingSpec7.OD, weight_per_ft: combinedProdCasingSpec7.Weight, grade: combinedProdCasingSpec7.Grade, connection: combinedProdCasingSpec7.connection, length_range: combinedProdCasingSpec7.length_range, tag: "PC " + combinedProdCasingSpec7.tag },

            { product_type: 'tubing', od_in: combinedTubingSpec0.OD, weight_per_ft: combinedTubingSpec0.Weight, grade: combinedTubingSpec0.Grade, connection: combinedTubingSpec0.connection, length_range: combinedTubingSpec0.length_range, tag: "T " + combinedTubingSpec0.tag },
            { product_type: 'tubing', od_in: combinedTubingSpec1.OD, weight_per_ft: combinedTubingSpec1.Weight, grade: combinedTubingSpec1.Grade, connection: combinedTubingSpec1.connection, length_range: combinedTubingSpec1.length_range, tag: "T " + combinedTubingSpec1.tag },
            { product_type: 'tubing', od_in: combinedTubingSpec2.OD, weight_per_ft: combinedTubingSpec2.Weight, grade: combinedTubingSpec2.Grade, connection: combinedTubingSpec2.connection, length_range: combinedTubingSpec2.length_range, tag: "T " + combinedTubingSpec2.tag },
            { product_type: 'tubing', od_in: combinedTubingSpec3.OD, weight_per_ft: combinedTubingSpec3.Weight, grade: combinedTubingSpec3.Grade, connection: combinedTubingSpec3.connection, length_range: combinedTubingSpec3.length_range, tag: "T " + combinedTubingSpec3.tag },
            { product_type: 'tubing', od_in: combinedTubingSpec4.OD, weight_per_ft: combinedTubingSpec4.Weight, grade: combinedTubingSpec4.Grade, connection: combinedTubingSpec4.connection, length_range: combinedTubingSpec4.length_range, tag: "T " + combinedTubingSpec4.tag },
            { product_type: 'tubing', od_in: combinedTubingSpec5.OD, weight_per_ft: combinedTubingSpec5.Weight, grade: combinedTubingSpec5.Grade, connection: combinedTubingSpec5.connection, length_range: combinedTubingSpec5.length_range, tag: "T " + combinedTubingSpec5.tag },
            { product_type: 'tubing', od_in: combinedTubingSpec6.OD, weight_per_ft: combinedTubingSpec6.Weight, grade: combinedTubingSpec6.Grade, connection: combinedTubingSpec6.connection, length_range: combinedTubingSpec6.length_range, tag: "T " + combinedTubingSpec6.tag },

            { product_type: 'pup_joint', od_in: combinedPupJointSpec0.OD, weight_per_ft: combinedPupJointSpec0.Weight, grade: combinedPupJointSpec0.Grade, connection: combinedPupJointSpec0.connection, length_range: combinedPupJointSpec0.length_range, tag: "PJ " + combinedPupJointSpec0.tag },
            { product_type: 'pup_joint', od_in: combinedPupJointSpec1.OD, weight_per_ft: combinedPupJointSpec1.Weight, grade: combinedPupJointSpec1.Grade, connection: combinedPupJointSpec1.connection, length_range: combinedPupJointSpec1.length_range, tag: "PJ " + combinedPupJointSpec1.tag },
            { product_type: 'pup_joint', od_in: combinedPupJointSpec2.OD, weight_per_ft: combinedPupJointSpec2.Weight, grade: combinedPupJointSpec2.Grade, connection: combinedPupJointSpec2.connection, length_range: combinedPupJointSpec2.length_range, tag: "PJ " + combinedPupJointSpec2.tag },
            { product_type: 'pup_joint', od_in: combinedPupJointSpec3.OD, weight_per_ft: combinedPupJointSpec3.Weight, grade: combinedPupJointSpec3.Grade, connection: combinedPupJointSpec3.connection, length_range: combinedPupJointSpec3.length_range, tag: "PJ " + combinedPupJointSpec3.tag },
            { product_type: 'pup_joint', od_in: combinedPupJointSpec4.OD, weight_per_ft: combinedPupJointSpec4.Weight, grade: combinedPupJointSpec4.Grade, connection: combinedPupJointSpec4.connection, length_range: combinedPupJointSpec4.length_range, tag: "PJ " + combinedPupJointSpec4.tag },
            { product_type: 'pup_joint', od_in: combinedPupJointSpec5.OD, weight_per_ft: combinedPupJointSpec5.Weight, grade: combinedPupJointSpec5.Grade, connection: combinedPupJointSpec5.connection, length_range: combinedPupJointSpec5.length_range, tag: "PJ " + combinedPupJointSpec5.tag },
            { product_type: 'pup_joint', od_in: combinedPupJointSpec6.OD, weight_per_ft: combinedPupJointSpec6.Weight, grade: combinedPupJointSpec6.Grade, connection: combinedPupJointSpec6.connection, length_range: combinedPupJointSpec6.length_range, tag: "PJ " + combinedPupJointSpec6.tag },
        ];
        const pipeSpecIds = new Map<string, string>();
        const pipeSpecTypes = new Map<string, string>(); // tag -> product_type, to check joints point at the right kind of spec

        const heats = [
            { mill_name: millsOpt.mill0.name, heat_number: 'H1123' },
            { mill_name: millsOpt.mill1.name, heat_number: 'H1456' },
            { mill_name: millsOpt.mill2.name, heat_number: 'H1789' },
            { mill_name: millsOpt.mill3.name, heat_number: 'H2123' },
            { mill_name: millsOpt.mill0.name, heat_number: 'H2456' },
            { mill_name: millsOpt.mill1.name, heat_number: 'H3123' },
            { mill_name: millsOpt.mill2.name, heat_number: 'H3456' },
            { mill_name: millsOpt.mill3.name, heat_number: 'H4123' },
            { mill_name: millsOpt.mill0.name, heat_number: 'H4456' },
            { mill_name: millsOpt.mill1.name, heat_number: 'H4789' },
        ];
        const heatIds = new Map<string, string>();

        const racks = [
            { yard_name: yardsOpt.yard0.name, code: 'A-01-1' },
            { yard_name: yardsOpt.yard1.name, code: 'A-01-2' },
            { yard_name: yardsOpt.yard2.name, code: 'A-01-3' },
            { yard_name: yardsOpt.yard3.name, code: 'A-01-4' },
            { yard_name: yardsOpt.yard0.name, code: 'B-01-1' },
            { yard_name: yardsOpt.yard1.name, code: 'B-01-2' },
            { yard_name: yardsOpt.yard2.name, code: 'B-01-3' },
            { yard_name: yardsOpt.yard3.name, code: 'C-01-1' },
            { yard_name: yardsOpt.yard0.name, code: 'C-01-2' },
            { yard_name: yardsOpt.yard1.name, code: 'D-01-1' },
        ];
        const rackIds = new Map<string, string>();

        const statusOptions = ['available', 'reserved', 'quarantined'];

        const joints: any = [];
        const inspections_arr: any = [];
        let totalCount = 0;
        for (let i = 0; i < 2; i++) {
            let cycleCount = ((i - 1) % 1) + 1
            // casing
            for (let j = 1; j <= 4; j++) {
                totalCount += cycleCount;
                console.log(`Test Joint ${totalCount}`);
                const serialNum = `Test Joint ${totalCount}`;
                joints.push({
                    serial_number: serialNum,
                    pipe_spec_name: combinedCasingSpec1.tag,
                    product_type: 'casing',
                    heat_name: heatNumOpt[j],
                    rack_name: racksOpt[j],
                    length_ft: randomLength(combinedCasingSpec1.length_range),
                    status: faker.helpers.arrayElement(statusOptions),
                    location_state: 'on_rack'
                })
                for(let jj = 0; jj < 2; jj++) {
                    inspections_arr.push({
                        joint_id: serialNum,
                        inspected_at: faker.date.past(),
                        result: faker.helpers.arrayElement(['pass', 'fail']),
                        inspector: faker.person.firstName(),
                        notes: faker.lorem.sentence()
                    });
                }
            }
            for (let k = 1; k <= 5; k++) {
                totalCount += cycleCount;
                console.log(`Test Joint ${totalCount}`);
                const serialNum = `Test Joint ${totalCount}`;
                joints.push({
                    serial_number: serialNum,
                    pipe_spec_name: combinedCasingSpec2.tag,
                    product_type: 'casing',
                    heat_name: heatNumOpt[k],
                    rack_name: racksOpt[k],
                    length_ft: randomLength(combinedCasingSpec2.length_range),
                    status: faker.helpers.arrayElement(statusOptions),
                    location_state: 'on_rack'
                })
                for(let jj = 0; jj < 3; jj++) {
                    inspections_arr.push({
                        joint_id: serialNum,
                        inspected_at: faker.date.past(),
                        result: faker.helpers.arrayElement(['pass', 'fail']),
                        inspector: faker.person.firstName(),
                        notes: faker.lorem.sentence()
                    });
                }
            }
            for (let l = 1; l <= 5; l++) {
                totalCount += cycleCount;
                console.log(`Test Joint ${totalCount}`);
                const serialNum = `Test Joint ${totalCount}`;
                joints.push({
                    serial_number: serialNum,
                    pipe_spec_name: combinedCasingSpec3.tag,
                    product_type: 'casing',
                    heat_name: heatNumOpt[l],
                    rack_name: racksOpt[l],
                    length_ft: randomLength(combinedCasingSpec3.length_range),
                    status: faker.helpers.arrayElement(statusOptions),
                    location_state: 'on_rack'
                })
                for(let jj = 0; jj < 2; jj++) {
                    inspections_arr.push({
                        joint_id: serialNum,
                        inspected_at: faker.date.past(),
                        result: faker.helpers.arrayElement(['pass', 'fail']),
                        inspector: faker.person.firstName(),
                        notes: faker.lorem.sentence()
                    });
                }
            }
            for (let m = 1; m <= 5; m++) {
                totalCount += cycleCount;
                console.log(`Test Joint ${totalCount}`);
                const serialNum = `Test Joint ${totalCount}`;
                joints.push({
                    serial_number: serialNum,
                    pipe_spec_name: combinedCasingSpec4.tag,
                    product_type: 'casing',
                    heat_name: heatNumOpt[m],
                    rack_name: racksOpt[m],
                    length_ft: randomLength(combinedCasingSpec4.length_range),
                    status: faker.helpers.arrayElement(statusOptions),
                    location_state: 'on_rack'
                })
                for(let jj = 0; jj < 3; jj++) {
                    inspections_arr.push({
                        joint_id: serialNum,
                        inspected_at: faker.date.past(),
                        result: faker.helpers.arrayElement(['pass', 'fail']),
                        inspector: faker.person.firstName(),
                        notes: faker.lorem.sentence()
                    });
                }
            }
            for (let n = 1; n <= 5; n++) {
                totalCount += cycleCount;
                console.log(`Test Joint ${totalCount}`);
                const serialNum = `Test Joint ${totalCount}`;
                joints.push({
                    serial_number: serialNum,
                    pipe_spec_name: combinedCasingSpec5.tag,
                    product_type: 'casing',
                    heat_name: heatNumOpt[n],
                    rack_name: racksOpt[n],
                    length_ft: randomLength(combinedCasingSpec5.length_range),
                    status: faker.helpers.arrayElement(statusOptions),
                    location_state: 'on_rack'
                })
                for(let jj = 0; jj < 2; jj++) {
                    inspections_arr.push({
                        joint_id: serialNum,
                        inspected_at: faker.date.past(),
                        result: faker.helpers.arrayElement(['pass', 'fail']),
                        inspector: faker.person.firstName(),
                        notes: faker.lorem.sentence()
                    });
                }
            }
            for (let o = 1; o <= 5; o++) {
                totalCount += cycleCount;
                console.log(`Test Joint ${totalCount}`);
                const serialNum = `Test Joint ${totalCount}`;
                joints.push({
                    serial_number: serialNum,
                    pipe_spec_name: combinedCasingSpec6.tag,
                    product_type: 'casing',
                    heat_name: heatNumOpt[o],
                    rack_name: racksOpt[o],
                    length_ft: randomLength(combinedCasingSpec6.length_range),
                    status: faker.helpers.arrayElement(statusOptions),
                    location_state: 'on_rack'
                })
                // for(let jj = 0; jj < 2; jj++) {
                //     inspections_arr.push({
                //         joint_id: serialNum,
                //         inspected_at: faker.date.past(),
                //         result: faker.helpers.arrayElement(['pass', 'fail']),
                //         inspector: faker.person.firstName(),
                //         notes: faker.lorem.sentence()
                //     });
                // }
            }
            // production_casing
            for (let p = 1; p <= 5; p++) {
                totalCount += cycleCount;
                console.log(`Test Joint ${totalCount}`);
                const serialNum = `Test Joint ${totalCount}`;
                joints.push({
                    serial_number: serialNum,
                    pipe_spec_name: "PC " + combinedProdCasingSpec1.tag,
                    product_type: 'production_casing',
                    heat_name: heatNumOpt[p],
                    rack_name: racksOpt[p],
                    length_ft: randomLength(combinedProdCasingSpec1.length_range),
                    status: faker.helpers.arrayElement(statusOptions),
                    location_state: 'on_rack'
                })
                for(let jj = 0; jj < 2; jj++) {
                    inspections_arr.push({
                        joint_id: serialNum,
                        inspected_at: faker.date.past(),
                        result: faker.helpers.arrayElement(['pass', 'fail']),
                        inspector: faker.person.firstName(),
                        notes: faker.lorem.sentence()
                    });
                }
            }
            for (let q = 1; q <= 5; q++) {
                totalCount += cycleCount;
                console.log(`Test Joint ${totalCount}`);
                const serialNum = `Test Joint ${totalCount}`;
                joints.push({
                    serial_number: serialNum,
                    pipe_spec_name: "PC " + combinedProdCasingSpec2.tag,
                    product_type: 'production_casing',
                    heat_name: heatNumOpt[q],
                    rack_name: racksOpt[q],
                    length_ft: randomLength(combinedProdCasingSpec2.length_range),
                    status: faker.helpers.arrayElement(statusOptions),
                    location_state: 'on_rack'
                })
                for(let jj = 0; jj < 3; jj++) {
                    inspections_arr.push({
                        joint_id: serialNum,
                        inspected_at: faker.date.past(),
                        result: faker.helpers.arrayElement(['pass', 'fail']),
                        inspector: faker.person.firstName(),
                        notes: faker.lorem.sentence()
                    });
                }
            }
            for (let r = 1; r <= 5; r++) {
                totalCount += cycleCount;
                console.log(`Test Joint ${totalCount}`);
                const serialNum = `Test Joint ${totalCount}`;
                joints.push({
                    serial_number: serialNum,
                    pipe_spec_name: "PC " + combinedProdCasingSpec3.tag,
                    product_type: 'production_casing',
                    heat_name: heatNumOpt[r],
                    rack_name: racksOpt[r],
                    length_ft: randomLength(combinedProdCasingSpec3.length_range),
                    status: faker.helpers.arrayElement(statusOptions),
                    location_state: 'on_rack'
                })
                for(let jj = 0; jj < 2; jj++) {
                    inspections_arr.push({
                        joint_id: serialNum,
                        inspected_at: faker.date.past(),
                        result: faker.helpers.arrayElement(['pass', 'fail']),
                        inspector: faker.person.firstName(),
                        notes: faker.lorem.sentence()
                    });
                }
            }
            for (let s = 1; s <= 5; s++) {
                totalCount += cycleCount;
                console.log(`Test Joint ${totalCount}`);
                const serialNum = `Test Joint ${totalCount}`;
                joints.push({
                    serial_number: serialNum,
                    pipe_spec_name: "PC " + combinedProdCasingSpec4.tag,
                    product_type: 'production_casing',
                    heat_name: heatNumOpt[s],
                    rack_name: racksOpt[s],
                    length_ft: randomLength(combinedProdCasingSpec4.length_range),
                    status: faker.helpers.arrayElement(statusOptions),
                    location_state: 'on_rack'
                })
                for(let jj = 0; jj < 3; jj++) {
                    inspections_arr.push({
                        joint_id: serialNum,
                        inspected_at: faker.date.past(),
                        result: faker.helpers.arrayElement(['pass', 'fail']),
                        inspector: faker.person.firstName(),
                        notes: faker.lorem.sentence()
                    });
                }
            }
            for (let t = 1; t <= 5; t++) {
                totalCount += cycleCount;
                console.log(`Test Joint ${totalCount}`);
                const serialNum = `Test Joint ${totalCount}`;
                joints.push({
                    serial_number: serialNum,
                    pipe_spec_name: "PC " + combinedProdCasingSpec5.tag,
                    product_type: 'production_casing',
                    heat_name: heatNumOpt[t],
                    rack_name: racksOpt[t],
                    length_ft: randomLength(combinedProdCasingSpec5.length_range),
                    status: faker.helpers.arrayElement(statusOptions),
                    location_state: 'on_rack'
                })
                for(let jj = 0; jj < 2; jj++) {
                    inspections_arr.push({
                        joint_id: serialNum,
                        inspected_at: faker.date.past(),
                        result: faker.helpers.arrayElement(['pass', 'fail']),
                        inspector: faker.person.firstName(),
                        notes: faker.lorem.sentence()
                    });
                }
            }
            for (let u = 1; u <= 5; u++) {
                totalCount += cycleCount;
                console.log(`Test Joint ${totalCount}`);
                const serialNum = `Test Joint ${totalCount}`;
                joints.push({
                    serial_number: serialNum,
                    pipe_spec_name: "PC " + combinedProdCasingSpec6.tag,
                    product_type: 'production_casing',
                    heat_name: heatNumOpt[u],
                    rack_name: racksOpt[u],
                    length_ft: randomLength(combinedProdCasingSpec6.length_range),
                    status: faker.helpers.arrayElement(statusOptions),
                    location_state: 'on_rack'
                })
                // for(let jj = 0; jj < 2; jj++) {
                //     inspections_arr.push({
                //         joint_id: serialNum,
                //         inspected_at: faker.date.past(),
                //         result: faker.helpers.arrayElement(['pass', 'fail']),
                //         inspector: faker.person.firstName(),
                //         notes: faker.lorem.sentence()
                //     });
                // }
            }
            // tubing
            for (let v = 1; v <= 5; v++) {
                totalCount += cycleCount;
                console.log(`Test Joint ${totalCount}`);
                const serialNum = `Test Joint ${totalCount}`;
                joints.push({
                    serial_number: serialNum,
                    pipe_spec_name: "T " + combinedTubingSpec1.tag,
                    product_type: 'tubing',
                    heat_name: heatNumOpt[v],
                    rack_name: racksOpt[v],
                    length_ft: randomLength(combinedTubingSpec1.length_range),
                    status: faker.helpers.arrayElement(statusOptions),
                    location_state: 'on_rack'
                })
                for(let jj = 0; jj < 2; jj++) {
                    inspections_arr.push({
                        joint_id: serialNum,
                        inspected_at: faker.date.past(),
                        result: faker.helpers.arrayElement(['pass', 'fail']),
                        inspector: faker.person.firstName(),
                        notes: faker.lorem.sentence()
                    });
                }
            }
            for (let w = 1; w <= 5; w++) {
                totalCount += cycleCount;
                console.log(`Test Joint ${totalCount}`);
                const serialNum = `Test Joint ${totalCount}`;
                joints.push({
                    serial_number: serialNum,
                    pipe_spec_name: "T " + combinedTubingSpec2.tag,
                    product_type: 'tubing',
                    heat_name: heatNumOpt[w],
                    rack_name: racksOpt[w],
                    length_ft: randomLength(combinedTubingSpec2.length_range),
                    status: faker.helpers.arrayElement(statusOptions),
                    location_state: 'on_rack'
                })
                for(let jj = 0; jj < 3; jj++) {
                    inspections_arr.push({
                        joint_id: serialNum,
                        inspected_at: faker.date.past(),
                        result: faker.helpers.arrayElement(['pass', 'fail']),
                        inspector: faker.person.firstName(),
                        notes: faker.lorem.sentence()
                    });
                }
            }
            for (let x = 1; x <= 5; x++) {
                totalCount += cycleCount;
                console.log(`Test Joint ${totalCount}`);
                const serialNum = `Test Joint ${totalCount}`;
                joints.push({
                    serial_number: serialNum,
                    pipe_spec_name: "T " + combinedTubingSpec3.tag,
                    product_type: 'tubing',
                    heat_name: heatNumOpt[x],
                    rack_name: racksOpt[x],
                    length_ft: randomLength(combinedTubingSpec3.length_range),
                    status: faker.helpers.arrayElement(statusOptions),
                    location_state: 'on_rack'
                })
                for(let jj = 0; jj < 2; jj++) {
                    inspections_arr.push({
                        joint_id: serialNum,
                        inspected_at: faker.date.past(),
                        result: faker.helpers.arrayElement(['pass', 'fail']),
                        inspector: faker.person.firstName(),
                        notes: faker.lorem.sentence()
                    });
                }
            }
            for (let y = 1; y <= 5; y++) {
                totalCount += cycleCount;
                console.log(`Test Joint ${totalCount}`);
                const serialNum = `Test Joint ${totalCount}`;
                joints.push({
                    serial_number: serialNum,
                    pipe_spec_name: "T " + combinedTubingSpec4.tag,
                    product_type: 'tubing',
                    heat_name: heatNumOpt[y],
                    rack_name: racksOpt[y],
                    length_ft: randomLength(combinedTubingSpec4.length_range),
                    status: faker.helpers.arrayElement(statusOptions),
                    location_state: 'on_rack'
                })
                for(let jj = 0; jj < 3; jj++) {
                    inspections_arr.push({
                        joint_id: serialNum,
                        inspected_at: faker.date.past(),
                        result: faker.helpers.arrayElement(['pass', 'fail']),
                        inspector: faker.person.firstName(),
                        notes: faker.lorem.sentence()
                    });
                }
            }
            for (let z = 1; z <= 5; z++) {
                totalCount += cycleCount;
                console.log(`Test Joint ${totalCount}`);
                const serialNum = `Test Joint ${totalCount}`;
                joints.push({
                    serial_number: serialNum,
                    pipe_spec_name: "T " + combinedTubingSpec5.tag,
                    product_type: 'tubing',
                    heat_name: heatNumOpt[z],
                    rack_name: racksOpt[z],
                    length_ft: randomLength(combinedTubingSpec5.length_range),
                    status: faker.helpers.arrayElement(statusOptions),
                    location_state: 'on_rack'
                })
                // for(let jj = 0; jj < 2; jj++) {
                //     inspections_arr.push({
                //         joint_id: serialNum,
                //         inspected_at: faker.date.past(),
                //         result: faker.helpers.arrayElement(['pass', 'fail']),
                //         inspector: faker.person.firstName(),
                //         notes: faker.lorem.sentence()
                //     });
                // }
            }
            // pup joint
            for (let a = 1; a <= 5; a++) {
                totalCount += cycleCount;
                console.log(`Test Joint ${totalCount}`);
                const serialNum = `Test Joint ${totalCount}`;
                joints.push({
                    serial_number: serialNum,
                    pipe_spec_name: "PJ " + combinedPupJointSpec1.tag,
                    product_type: 'pup_joint',
                    heat_name: heatNumOpt[a],
                    rack_name: racksOpt[a],
                    length_ft: randomLength(combinedPupJointSpec1.length_range),
                    status: faker.helpers.arrayElement(statusOptions),
                    location_state: 'on_rack'
                })
                for(let jj = 0; jj < 2; jj++) {
                    inspections_arr.push({
                        joint_id: serialNum,
                        inspected_at: faker.date.past(),
                        result: faker.helpers.arrayElement(['pass', 'fail']),
                        inspector: faker.person.firstName(),
                        notes: faker.lorem.sentence()
                    });
                }
            }
            for (let b = 1; b <= 5; b++) {
                totalCount += cycleCount;
                console.log(`Test Joint ${totalCount}`);
                const serialNum = `Test Joint ${totalCount}`;
                joints.push({
                    serial_number: serialNum,
                    pipe_spec_name: "PJ " + combinedPupJointSpec2.tag,
                    product_type: 'pup_joint',
                    heat_name: heatNumOpt[b],
                    rack_name: racksOpt[b],
                    length_ft: randomLength(combinedPupJointSpec2.length_range),
                    status: faker.helpers.arrayElement(statusOptions),
                    location_state: 'on_rack'
                })
                for(let jj = 0; jj < 3; jj++) {
                    inspections_arr.push({
                        joint_id: serialNum,
                        inspected_at: faker.date.past(),
                        result: faker.helpers.arrayElement(['pass', 'fail']),
                        inspector: faker.person.firstName(),
                        notes: faker.lorem.sentence()
                    });
                }
            }
            for (let c = 1; c <= 5; c++) {
                totalCount += cycleCount;
                console.log(`Test Joint ${totalCount}`);
                const serialNum = `Test Joint ${totalCount}`;
                joints.push({
                    serial_number: serialNum,
                    pipe_spec_name: "PJ " + combinedPupJointSpec3.tag,
                    product_type: 'pup_joint',
                    heat_name: heatNumOpt[c],
                    rack_name: racksOpt[c],
                    length_ft: randomLength(combinedPupJointSpec3.length_range),
                    status: faker.helpers.arrayElement(statusOptions),
                    location_state: 'on_rack'
                })
                for(let jj = 0; jj < 2; jj++) {
                    inspections_arr.push({
                        joint_id: serialNum,
                        inspected_at: faker.date.past(),
                        result: faker.helpers.arrayElement(['pass', 'fail']),
                        inspector: faker.person.firstName(),
                        notes: faker.lorem.sentence()
                    });
                }
            }
            for (let d = 1; d <= 5; d++) {
                totalCount += cycleCount;
                console.log(`Test Joint ${totalCount}`);
                const serialNum = `Test Joint ${totalCount}`;
                joints.push({
                    serial_number: serialNum,
                    pipe_spec_name: "PJ " + combinedPupJointSpec4.tag,
                    product_type: 'pup_joint',
                    heat_name: heatNumOpt[d],
                    rack_name: racksOpt[d],
                    length_ft: randomLength(combinedPupJointSpec4.length_range),
                    status: faker.helpers.arrayElement(statusOptions),
                    location_state: 'on_rack'
                })
                for(let jj = 0; jj < 3; jj++) {
                    inspections_arr.push({
                        joint_id: serialNum,
                        inspected_at: faker.date.past(),
                        result: faker.helpers.arrayElement(['pass', 'fail']),
                        inspector: faker.person.firstName(),
                        notes: faker.lorem.sentence()
                    });
                }
            }
            for (let e = 1; e <= 5; e++) {
                totalCount += cycleCount;
                console.log(`Test Joint ${totalCount}`);
                const serialNum = `Test Joint ${totalCount}`;
                joints.push({
                    serial_number: serialNum,
                    pipe_spec_name: "PJ " + combinedPupJointSpec5.tag,
                    product_type: 'pup_joint',
                    heat_name: heatNumOpt[e],
                    rack_name: racksOpt[e],
                    length_ft: randomLength(combinedPupJointSpec5.length_range),
                    status: faker.helpers.arrayElement(statusOptions),
                    location_state: 'on_rack'
                })
                // for(let jj = 0; jj < 2; jj++) {
                //     inspections_arr.push({
                //         joint_id: serialNum,
                //         inspected_at: faker.date.past(),
                //         result: faker.helpers.arrayElement(['pass', 'fail']),
                //         inspector: faker.person.firstName(),
                //         notes: faker.lorem.sentence()
                //     });
                // }
            }
        }

        // const joints = [
        //     { serial_number: 'Test Joint 1', pipe_spec_name: combinedCasingSpec1.tag, product_type: 'casing', heat_name: heatNumOpt[1], rack_name: 'A-01-1', length_ft: 20, status: 'available', location_state: 'on_rack' },
        //     { serial_number: 'Test Joint 2', pipe_spec_name: "PC " + combinedProdCasingSpec2.tag, product_type: 'production_casing', heat_name: heatNumOpt[2], rack_name: 'B-01-1', length_ft: 25, status: 'available', location_state: 'on_rack' },
        //     { serial_number: 'Test Joint 3', pipe_spec_name: "T " + combinedTubingSpec3.tag, product_type: 'tubing', heat_name: heatNumOpt[3], rack_name: 'C-01-1', length_ft: 30, status: 'reserved', location_state: 'on_rack' },
        //     { serial_number: 'Test Joint 4', pipe_spec_name: combinedCasingSpec0.tag, product_type: 'casing', heat_name: heatNumOpt[4], rack_name: 'D-01-1', length_ft: 35, faker.helpers.arrayElement(statusOptions), location_state: 'on_rack' },
        //     { serial_number: 'Test Joint 5', pipe_spec_name: "PJ " + combinedPupJointSpec5.tag, product_type: 'pup_joint', heat_name: heatNumOpt[5], rack_name: 'D-01-1', length_ft: 29, faker.helpers.arrayElement(statusOptions), location_state: 'on_rack' },
        //     { serial_number: 'Test Joint 6', pipe_spec_name: "PJ " + combinedPupJointSpec4.tag, product_type: 'pup_joint', heat_name: heatNumOpt[6], rack_name: 'D-01-1', length_ft: 30, faker.helpers.arrayElement(statusOptions), location_state: 'on_rack' },
        // ];
        const jointIds = new Map<string, string>();

        // const inspections = [
        //     { joint_id: 'Test Joint 1', inspected_at: '2025-06-13 17:39:28.642167+00', result: 'pending', inspector: 'John Doe', notes: 'Initial inspection' },
        //     { joint_id: 'Test Joint 2', inspected_at: '2025-11-04 17:39:28.642167+00', result: 'fail', inspector: 'Jane Smith', notes: 'Crack detected' },
        //     { joint_id: 'Test Joint 3', inspected_at: '2025-10-15 17:39:28.642167+00', result: 'pass', inspector: 'Bob Johnson', notes: 'All tests passed' },
        //     { joint_id: 'Test Joint 4', inspected_at: '2026-10-12 17:39:28.642167+00', result: 'pending', inspector: 'Alice Brown', notes: 'Awaiting results' },
        // ];

        // 3. Insert Seed Data safely using parameterized queries
        console.log('Inserting seed data...');
        const insertYardQuery = 'INSERT INTO yards (name, region) VALUES (\$1, \$2) RETURNING id;';

        for (const yard of yards) {
            const result = await client.query(insertYardQuery, [yard.name, yard.region]);
            yardIds.set(yard.name, result.rows[0]!.id);
        };

        const insertMillQuery = 'INSERT INTO mills (name, location) VALUES (\$1, \$2) RETURNING id;';

        for (const mill of mills) {
            const result = await client.query(insertMillQuery, [mill.name, mill.location]);
            console.log(`mill ID: ${result.rows[0]!.id}`);
            millIds.set(mill.name, result.rows[0]!.id);
        }

        const insertPipeSpecQuery = 'INSERT INTO pipe_specs (product_type, od_in, weight_per_ft, grade, connection, length_range, tag) VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7) RETURNING id;';

        for (const spec of pipe_specs) {
            const result = await client.query(insertPipeSpecQuery, [spec.product_type, spec.od_in, spec.weight_per_ft, spec.grade, spec.connection, spec.length_range, spec.tag]);
            pipeSpecIds.set(spec.tag, result.rows[0]!.id);
            pipeSpecTypes.set(spec.tag, spec.product_type);
        }

        const insertHeatsQuery = 'INSERT INTO heats (mill_id, heat_number) VALUES (\$1, \$2) RETURNING id;';

        for (const heat of heats) {
            const result = await client.query(insertHeatsQuery, [millIds.get(heat.mill_name), heat.heat_number]);
            heatIds.set(heat.heat_number, result.rows[0]!.id);
        }

        const insertRacksQuery = 'INSERT INTO racks (yard_id, code) VALUES (\$1, \$2) RETURNING id;';

        for (const rack of racks) {
            const result = await client.query(insertRacksQuery, [yardIds.get(rack.yard_name), rack.code]);
            rackIds.set(rack.code, result.rows[0]!.id);
        }

        const insertJointsQuery = 'INSERT INTO joints (serial_number, pipe_spec_id, heat_id, rack_id, length_ft, status, location_state) VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7) RETURNING id;';

        for (const joint of joints) {
            const pipeSpecId = pipeSpecIds.get(joint.pipe_spec_name);
            if (!pipeSpecId) throw new Error(`${joint.serial_number}: unknown pipe spec tag "${joint.pipe_spec_name}"`);
            // A tag can exist but belong to a different product type (the old "asper" vs "T asper" bug), so check it
            const specType = pipeSpecTypes.get(joint.pipe_spec_name);
            if (specType !== joint.product_type) {
                throw new Error(`${joint.serial_number}: is ${joint.product_type} but spec "${joint.pipe_spec_name}" is ${specType}`);
            }
            const heatId = heatIds.get(joint.heat_name);
            if (!heatId) throw new Error(`${joint.serial_number}: unknown heat "${joint.heat_name}"`);
            const rackId = rackIds.get(joint.rack_name);
            if (!rackId) throw new Error(`${joint.serial_number}: unknown rack "${joint.rack_name}"`);

            const result = await client.query(insertJointsQuery, [joint.serial_number, pipeSpecId, heatId, rackId, joint.length_ft, joint.status, joint.location_state]);
            jointIds.set(joint.serial_number, result.rows[0]!.id);
        }

        const insertInspectionQuery = 'INSERT INTO inspections (joint_id, inspected_at, result, inspector, notes) VALUES (\$1, \$2, \$3, \$4, \$5) RETURNING id;';

        for (const inspection of inspections_arr) {
            const jointId = jointIds.get(inspection.joint_id);
            if (!jointId) throw new Error(`Inspection for unknown joint "${inspection.joint_id}"`);
            const result = await client.query(insertInspectionQuery, [jointId, inspection.inspected_at, inspection.result, inspection.inspector, inspection.notes]);
            // inspectionIds.set(inspection.joint_serial_number, result.rows[0]!.id);
        }

        // Commit transaction
        await client.query('COMMIT');
        console.log('Database seeded successfully!');

    } finally {
        console.log('Inventory seeding completed.');
        client.release();
    }
}

(
    async () => {
        try {
            await seedInventory();
        } catch (error) {
            console.error('Error occurred while seeding inventory:', error);
            process.exitCode = 1;
        } finally {
            process.exit();
        }
    }
)();