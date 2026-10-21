const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });

// Mongoose Models
const Role = require('./models/Role');
const User = require('./models/User');
const Dataset = require('./models/Dataset');
const DemographicRecord = require('./models/DemographicRecord');
const BiometricRecord = require('./models/BiometricRecord');
const Resource = require('./models/Resource');
const ResourceAllocation = require('./models/ResourceAllocation');

// Helper to convert DD-MM-YYYY or YYYY-MM-DD to YYYY-MM
function convertDateToPeriod(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    // If DD-MM-YYYY
    if (parts[0].length <= 2 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}`;
    }
    // If YYYY-MM-DD
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}`;
    }
  }
  if (parts.length === 2 && parts[0].length === 4) {
    return dateStr;
  }
  return null;
}

// Custom simple CSV parser
function parseCSV(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length !== headers.length) continue;
    const row = {};
    headers.forEach((h, index) => {
      row[h] = values[index];
    });
    rows.push(row);
  }
  return rows;
}

// Batch insert helper to avoid BSON / CallStack overflows on large datasets
async function batchInsert(Model, docs, batchSize = 5000) {
  if (!docs || docs.length === 0) return 0;
  for (let i = 0; i < docs.length; i += batchSize) {
    const chunk = docs.slice(i, i + batchSize);
    await Model.insertMany(chunk);
  }
  return docs.length;
}

async function runSeed() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/astra_db';
  console.log('====================================================');
  console.log('       ASTRA DATABASE SEEDING ENGINE                ');
  console.log('====================================================');
  console.log(`Connecting to MongoDB at: ${mongoUri}`);

  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Successfully connected to MongoDB database.');

    // 1. CLEAR EXISTING COLLECTIONS (Clean Reset)
    console.log('\n[1/5] Purging existing database collections...');
    await Role.deleteMany({});
    await User.deleteMany({});
    await Dataset.deleteMany({});
    await DemographicRecord.deleteMany({});
    await BiometricRecord.deleteMany({});
    await Resource.deleteMany({});
    await ResourceAllocation.deleteMany({});
    console.log('✓ Collections purged.');

    // 2. SEED SYSTEM ROLES
    console.log('\n[2/5] Seeding core RBAC roles...');
    const adminRole = await Role.create({
      name: 'Administrator',
      permissions: ['manage_users', 'view_audit_logs', 'upload_datasets', 'manage_datasets', 'generate_forecasts'],
      description: 'System Administrator with full access rights'
    });
    const analystRole = await Role.create({
      name: 'Data Analyst',
      permissions: ['upload_datasets'],
      description: 'Government Data Analyst'
    });
    const plannerRole = await Role.create({
      name: 'Resource Planning Officer',
      permissions: ['generate_forecasts'],
      description: 'Planning officer for resource allocation'
    });
    const deptRole = await Role.create({
      name: 'Department Officer',
      permissions: [],
      description: 'Officer with read-only views'
    });
    console.log('✓ Roles seeded (Administrator, Data Analyst, Resource Planning Officer, Department Officer).');

    // 3. SEED INITIAL SYSTEM USERS
    console.log('\n[3/5] Provisioning system users...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123', salt);

    const adminUser = await User.create({
      name: 'A.S.T.R.A. Admin',
      email: 'admin@astra.gov.in',
      passwordHash,
      roleId: adminRole._id,
      department: 'UIDAI Administration HQ',
      status: 'active'
    });
    const analystUser = await User.create({
      name: 'A.S.T.R.A. Analyst',
      email: 'analyst@astra.gov.in',
      passwordHash,
      roleId: analystRole._id,
      department: 'UIDAI Data Analytics Div',
      status: 'active'
    });
    const plannerUser = await User.create({
      name: 'A.S.T.R.A. Planner',
      email: 'planner@astra.gov.in',
      passwordHash,
      roleId: plannerRole._id,
      department: 'UIDAI Planning Commission',
      status: 'active'
    });
    console.log(`✓ Provisioned system users with default credentials:
    - Admin:   admin@astra.gov.in   (Password: Password123)
    - Analyst: analyst@astra.gov.in (Password: Password123)
    - Planner: planner@astra.gov.in (Password: Password123)`);

    // 4. SEED RESOURCE CATALOG & ALLOCATIONS FROM ACTUAL DATASETS
    console.log('\n[4/5] Ingesting Resource Allocations dataset...');
    const rootDir = path.join(__dirname, '..');
    const datasetsDir = path.join(rootDir, 'datasets');

    // Default Resource Catalog Items
    const kitResource = await Resource.create({
      name: 'Aadhaar Enrollment Kits',
      unit: 'kits',
      description: 'Desktop kits with camera, iris scanner, GPS and biometric devices'
    });
    const scannerResource = await Resource.create({
      name: 'Biometric Iris Scanners',
      unit: 'scanners',
      description: 'Biometric dual iris capture scanners'
    });
    const personnelResource = await Resource.create({
      name: 'Trained Personnel (Units)',
      unit: 'units',
      description: 'Certified operators and verification officers'
    });

    const resourceMap = {
      'aadhaar enrollment kits': kitResource,
      'biometric iris scanners': scannerResource,
      'trained personnel (units)': personnelResource
    };

    const sampleResourcesFile = path.join(datasetsDir, 'sample_resources.csv');
    if (fs.existsSync(sampleResourcesFile)) {
      const resRows = parseCSV(sampleResourcesFile);
      console.log(`  Parsing dataset: ${sampleResourcesFile} (${resRows.length} rows)`);

      const resDataset = await Dataset.create({
        name: 'sample_resources.csv',
        category: 'resource',
        sourceFileName: 'sample_resources.csv',
        uploadedBy: adminUser._id,
        status: 'Ready',
        rowCount: resRows.length,
        qualityScore: 100.0,
        validationSummary: { errorCount: 0, warningCount: 0, messages: [] }
      });

      const allocationsToInsert = [];
      for (const row of resRows) {
        const resKey = (row.resource_name || '').trim().toLowerCase();
        let resourceObj = resourceMap[resKey];
        if (!resourceObj) {
          resourceObj = await Resource.create({
            name: row.resource_name.trim(),
            unit: 'units',
            description: `Auto-registered catalog resource: ${row.resource_name.trim()}`
          });
          resourceMap[resKey] = resourceObj;
        }

        const allocated = parseInt(row.allocated) || 0;
        const utilized = parseInt(row.utilized) || 0;

        allocationsToInsert.push({
          datasetId: resDataset._id,
          resourceId: resourceObj._id,
          state: (row.state || '').trim().toLowerCase(),
          district: (row.district || '').trim().toLowerCase(),
          period: (row.period || '').trim(),
          allocatedAmount: allocated,
          utilizedAmount: utilized,
          demandIndicator: allocated - utilized
        });
      }

      await batchInsert(ResourceAllocation, allocationsToInsert);
      console.log(`  ✓ Inserted ${allocationsToInsert.length} resource allocation records from dataset.`);
    } else {
      console.warn(`  ! Resource dataset file missing at: ${sampleResourcesFile}`);
    }

    // 5. INGEST DEMOGRAPHIC & BIOMETRIC DATASETS
    console.log('\n[5/5] Ingesting Demographic & Biometric datasets...');

    // A. Sample Demographics Dataset
    const sampleDemoFile = path.join(datasetsDir, 'sample_demographics.csv');
    if (fs.existsSync(sampleDemoFile)) {
      const demoRows = parseCSV(sampleDemoFile);
      console.log(`  Parsing dataset: ${sampleDemoFile} (${demoRows.length} rows)`);

      const demoDataset = await Dataset.create({
        name: 'sample_demographics.csv',
        category: 'demographic',
        sourceFileName: 'sample_demographics.csv',
        uploadedBy: adminUser._id,
        status: 'Ready',
        rowCount: demoRows.length,
        qualityScore: 100.0,
        validationSummary: { errorCount: 0, warningCount: 0, messages: [] }
      });

      const demographicRecords = demoRows.map(row => ({
        datasetId: demoDataset._id,
        state: (row.state || '').trim().toLowerCase(),
        district: (row.district || '').trim().toLowerCase(),
        ageBand: (row.age_band || 'all').trim(),
        gender: (row.gender || 'O').trim().toUpperCase(),
        period: (row.period || '').trim(),
        count: parseInt(row.count) || 0
      }));

      await batchInsert(DemographicRecord, demographicRecords);
      console.log(`  ✓ Inserted ${demographicRecords.length} demographic records from sample_demographics.csv.`);
    }

    // B. Root Demographic Open Dataset (if present)
    const rootDemoFile = path.join(rootDir, 'api_data_aadhar_demographic_2000000_2071700.csv');
    if (fs.existsSync(rootDemoFile)) {
      console.log(`  Parsing root dataset: ${rootDemoFile}...`);
      const rootDemoRows = parseCSV(rootDemoFile);
      const demoDataset = await Dataset.create({
        name: 'api_data_aadhar_demographic_2000000_2071700.csv',
        category: 'demographic',
        sourceFileName: 'api_data_aadhar_demographic_2000000_2071700.csv',
        uploadedBy: adminUser._id,
        status: 'Ready',
        rowCount: rootDemoRows.length,
        qualityScore: 100.0,
        validationSummary: { errorCount: 0, warningCount: 0, messages: [] }
      });

      // Group and aggregate by state, district, period
      const demoGrouped = {};
      for (const r of rootDemoRows) {
        const period = convertDateToPeriod(r.date);
        if (!period) continue;
        const state = (r.state || '').toLowerCase().trim();
        const district = (r.district || '').toLowerCase().trim();
        const key = `${state}|${district}|${period}`;

        if (!demoGrouped[key]) {
          demoGrouped[key] = { state, district, period, demo_5_17: 0, demo_17_plus: 0 };
        }
        demoGrouped[key].demo_5_17 += parseInt(r.demo_age_5_17) || 0;
        demoGrouped[key].demo_17_plus += parseInt(r.demo_age_17_) || 0;
      }

      const records = [];
      for (const key of Object.keys(demoGrouped)) {
        const g = demoGrouped[key];
        if (g.demo_5_17 > 0) {
          records.push({ datasetId: demoDataset._id, state: g.state, district: g.district, ageBand: '5-18', gender: 'ALL', period: g.period, count: g.demo_5_17 });
        }
        if (g.demo_17_plus > 0) {
          records.push({ datasetId: demoDataset._id, state: g.state, district: g.district, ageBand: '18+', gender: 'ALL', period: g.period, count: g.demo_17_plus });
        }
      }

      await batchInsert(DemographicRecord, records);
      console.log(`  ✓ Aggregated & inserted ${records.length} records from root demographic CSV.`);
    }

    // C. Sample Biometrics Dataset
    const sampleBioFile = path.join(datasetsDir, 'sample_biometrics.csv');
    if (fs.existsSync(sampleBioFile)) {
      const bioRows = parseCSV(sampleBioFile);
      console.log(`  Parsing dataset: ${sampleBioFile} (${bioRows.length} rows)`);

      const bioDataset = await Dataset.create({
        name: 'sample_biometrics.csv',
        category: 'biometric',
        sourceFileName: 'sample_biometrics.csv',
        uploadedBy: adminUser._id,
        status: 'Ready',
        rowCount: bioRows.length,
        qualityScore: 100.0,
        validationSummary: { errorCount: 0, warningCount: 0, messages: [] }
      });

      const biometricRecords = bioRows.map(row => ({
        datasetId: bioDataset._id,
        state: (row.state || '').trim().toLowerCase(),
        district: (row.district || '').trim().toLowerCase(),
        type: (row.type || 'update').trim().toLowerCase(),
        ageBand: (row.age_band || 'all').trim(),
        period: (row.period || '').trim(),
        count: parseInt(row.count) || 0
      }));

      await batchInsert(BiometricRecord, biometricRecords);
      console.log(`  ✓ Inserted ${biometricRecords.length} biometric records from sample_biometrics.csv.`);
    }

    // D. Root Enrolment Open Dataset (if present)
    const rootEnrolFile = path.join(rootDir, 'api_data_aadhar_enrolment_1000000_1006029.csv');
    if (fs.existsSync(rootEnrolFile)) {
      console.log(`  Parsing root dataset: ${rootEnrolFile}...`);
      const enrolRows = parseCSV(rootEnrolFile);
      const enrolDataset = await Dataset.create({
        name: 'api_data_aadhar_enrolment_1000000_1006029.csv',
        category: 'biometric',
        sourceFileName: 'api_data_aadhar_enrolment_1000000_1006029.csv',
        uploadedBy: adminUser._id,
        status: 'Ready',
        rowCount: enrolRows.length,
        qualityScore: 100.0,
        validationSummary: { errorCount: 0, warningCount: 0, messages: [] }
      });

      const enrolGrouped = {};
      for (const r of enrolRows) {
        const period = convertDateToPeriod(r.date);
        if (!period) continue;
        const state = (r.state || '').toLowerCase().trim();
        const district = (r.district || '').toLowerCase().trim();
        const key = `${state}|${district}|${period}`;

        if (!enrolGrouped[key]) {
          enrolGrouped[key] = { state, district, period, count: 0 };
        }
        enrolGrouped[key].count += (parseInt(r.age_0_5) || 0) + (parseInt(r.age_5_17) || 0) + (parseInt(r.age_18_greater) || 0);
      }

      const enrolRecords = Object.values(enrolGrouped).map(g => ({
        datasetId: enrolDataset._id,
        state: g.state,
        district: g.district,
        type: 'enrollment',
        ageBand: 'all',
        period: g.period,
        count: g.count
      }));

      await batchInsert(BiometricRecord, enrolRecords);
      console.log(`  ✓ Aggregated & inserted ${enrolRecords.length} records from root enrolment CSV.`);
    }

    // E. Root Biometric Open Dataset (if present)
    const rootBioFile = path.join(rootDir, 'api_data_aadhar_biometric_0_500000.csv');
    if (fs.existsSync(rootBioFile)) {
      console.log(`  Parsing root dataset: ${rootBioFile}...`);
      const bioRows = parseCSV(rootBioFile);
      const rootBioDataset = await Dataset.create({
        name: 'api_data_aadhar_biometric_0_500000.csv',
        category: 'biometric',
        sourceFileName: 'api_data_aadhar_biometric_0_500000.csv',
        uploadedBy: adminUser._id,
        status: 'Ready',
        rowCount: bioRows.length,
        qualityScore: 100.0,
        validationSummary: { errorCount: 0, warningCount: 0, messages: [] }
      });

      const bioGrouped = {};
      for (const r of bioRows) {
        const period = convertDateToPeriod(r.date);
        if (!period) continue;
        const state = (r.state || '').toLowerCase().trim();
        const district = (r.district || '').toLowerCase().trim();
        const key = `${state}|${district}|${period}`;

        if (!bioGrouped[key]) {
          bioGrouped[key] = { state, district, period, count: 0 };
        }
        bioGrouped[key].count += (parseInt(r.bio_age_5_17) || 0) + (parseInt(r.bio_age_17_) || 0);
      }

      const updateRecords = Object.values(bioGrouped).map(g => ({
        datasetId: rootBioDataset._id,
        state: g.state,
        district: g.district,
        type: 'update',
        ageBand: 'all',
        period: g.period,
        count: g.count
      }));

      await batchInsert(BiometricRecord, updateRecords);
      console.log(`  ✓ Aggregated & inserted ${updateRecords.length} records from root biometric CSV.`);
    }

    console.log('\n====================================================');
    console.log('✓ SEEDING COMPLETED SUCCESSFULLY — ZERO MOCK/DEMO MATH');
    console.log('====================================================');
    process.exit(0);

  } catch (error) {
    console.error('\n✗ Seeding process crashed:', error);
    process.exit(1);
  }
}

runSeed();
