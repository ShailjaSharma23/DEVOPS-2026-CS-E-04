const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

// Mongoose Models
const Role = require('./models/Role');
const User = require('./models/User');
const Dataset = require('./models/Dataset');
const DemographicRecord = require('./models/DemographicRecord');
const BiometricRecord = require('./models/BiometricRecord');
const Resource = require('./models/Resource');
const ResourceAllocation = require('./models/ResourceAllocation');

// Helper to convert DD-MM-YYYY to YYYY-MM
function convertDateToPeriod(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}`; // YYYY-MM
  }
  return null;
}

// Custom simple CSV parser
function parseCSV(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return [];
  }
  console.log(`Parsing CSV: ${filePath}`);
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

async function runSeed() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/astra_db';
  console.log(`Connecting to MongoDB at: ${mongoUri}`);
  
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Successfully connected to MongoDB.');

    // 1. CLEAR COLLECTIONS
    console.log('Clearing existing collections...');
    await Role.deleteMany({});
    await User.deleteMany({});
    await Dataset.deleteMany({});
    await DemographicRecord.deleteMany({});
    await BiometricRecord.deleteMany({});
    await Resource.deleteMany({});
    await ResourceAllocation.deleteMany({});
    console.log('Collections cleared.');

    // 2. SEED ROLES
    console.log('Seeding roles...');
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
    console.log('Roles seeded.');

    // 3. SEED USERS (Password is 'Password123' for all)
    console.log('Seeding system users...');
    const bcrypt = require('bcryptjs');
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
    console.log(`Users provisioned:
      - Admin: admin@astra.gov.in (Password: Password123)
      - Analyst: analyst@astra.gov.in (Password: Password123)
      - Planner: planner@astra.gov.in (Password: Password123)`);

    // 4. REGISTER DATASETS
    console.log('Creating Dataset Ingestion records...');
    const demoDataset = await Dataset.create({
      name: 'api_data_aadhar_demographic_2000000_2071700.csv',
      category: 'demographic',
      sourceFileName: 'api_data_aadhar_demographic_2000000_2071700.csv',
      uploadedBy: adminUser._id,
      status: 'Ready',
      rowCount: 0,
      qualityScore: 100.0
    });
    const bioDataset = await Dataset.create({
      name: 'api_data_aadhar_biometric_0_500000.csv',
      category: 'biometric',
      sourceFileName: 'api_data_aadhar_biometric_0_500000.csv',
      uploadedBy: adminUser._id,
      status: 'Ready',
      rowCount: 0,
      qualityScore: 100.0
    });
    const enrolDataset = await Dataset.create({
      name: 'api_data_aadhar_enrolment_1000000_1006029.csv',
      category: 'biometric',
      sourceFileName: 'api_data_aadhar_enrolment_1000000_1006029.csv',
      uploadedBy: adminUser._id,
      status: 'Ready',
      rowCount: 0,
      qualityScore: 100.0
    });
    const resourceDataset = await Dataset.create({
      name: 'resource_allocation_history.csv',
      category: 'resource',
      sourceFileName: 'resource_allocation_history.csv',
      uploadedBy: adminUser._id,
      status: 'Ready',
      rowCount: 0,
      qualityScore: 100.0
    });

    // 5. PARSE AND AGGREGATE RAW FILES
    const rootDir = path.join(__dirname, '..');
    
    // -- A. Demographic Data --
    const demographicFile = path.join(rootDir, 'api_data_aadhar_demographic_2000000_2071700.csv');
    if (fs.existsSync(demographicFile)) {
      const demoRows = parseCSV(demographicFile);
      console.log(`Processing ${demoRows.length} demographic update rows...`);
      const demoGrouped = {};
      for (const r of demoRows) {
        const period = convertDateToPeriod(r.date);
        if (!period) continue;
        const state = r.state.toLowerCase().trim();
        const district = r.district.toLowerCase().trim();
        const key = `${state}|${district}|${period}`;
        
        if (!demoGrouped[key]) {
          demoGrouped[key] = { state, district, period, demo_5_18: 0, demo_18_greater: 0 };
        }
        demoGrouped[key].demo_5_18 += parseInt(r.demo_age_5_17) || 0;
        demoGrouped[key].demo_18_greater += parseInt(r.demo_age_17_) || 0;
      }

      const demographicRecords = [];
      for (const key of Object.keys(demoGrouped)) {
        const grp = demoGrouped[key];
        
        // age_5_18 split 50/50 M and F
        const m_5_18 = Math.floor(grp.demo_5_18 / 2);
        const f_5_18 = grp.demo_5_18 - m_5_18;
        if (m_5_18 > 0) demographicRecords.push({ datasetId: demoDataset._id, state: grp.state, district: grp.district, ageBand: '5-18', gender: 'M', period: grp.period, count: m_5_18 });
        if (f_5_18 > 0) demographicRecords.push({ datasetId: demoDataset._id, state: grp.state, district: grp.district, ageBand: '5-18', gender: 'F', period: grp.period, count: f_5_18 });
        
        // age_18_greater split 50/50 gender, split 50/50 age bands '18-35' and '35-60'
        const m_18_greater = Math.floor(grp.demo_18_greater / 2);
        const f_18_greater = grp.demo_18_greater - m_18_greater;
        
        if (m_18_greater > 0) {
          const m_18_35 = Math.floor(m_18_greater / 2);
          const m_35_60 = m_18_greater - m_18_35;
          if (m_18_35 > 0) demographicRecords.push({ datasetId: demoDataset._id, state: grp.state, district: grp.district, ageBand: '18-35', gender: 'M', period: grp.period, count: m_18_35 });
          if (m_35_60 > 0) demographicRecords.push({ datasetId: demoDataset._id, state: grp.state, district: grp.district, ageBand: '35-60', gender: 'M', period: grp.period, count: m_35_60 });
        }
        if (f_18_greater > 0) {
          const f_18_35 = Math.floor(f_18_greater / 2);
          const f_35_60 = f_18_greater - f_18_35;
          if (f_18_35 > 0) demographicRecords.push({ datasetId: demoDataset._id, state: grp.state, district: grp.district, ageBand: '18-35', gender: 'F', period: grp.period, count: f_18_35 });
          if (f_35_60 > 0) demographicRecords.push({ datasetId: demoDataset._id, state: grp.state, district: grp.district, ageBand: '35-60', gender: 'F', period: grp.period, count: f_35_60 });
        }
      }
      
      console.log(`Inserting ${demographicRecords.length} aggregated DemographicRecords to DB...`);
      await DemographicRecord.insertMany(demographicRecords);
      demoDataset.rowCount = demographicRecords.length;
      await demoDataset.save();
    } else {
      console.warn(`Demographic dataset csv is not placed in the root directory: ${demographicFile}`);
    }

    // -- B. Biometric Update Data --
    const biometricRecords = [];
    const biometricFile = path.join(rootDir, 'api_data_aadhar_biometric_0_500000.csv');
    if (fs.existsSync(biometricFile)) {
      const bioRows = parseCSV(biometricFile);
      console.log(`Processing ${bioRows.length} biometric update rows...`);
      const bioGrouped = {};
      for (const r of bioRows) {
        const period = convertDateToPeriod(r.date);
        if (!period) continue;
        const state = r.state.toLowerCase().trim();
        const district = r.district.toLowerCase().trim();
        const key = `${state}|${district}|${period}`;
        
        if (!bioGrouped[key]) {
          bioGrouped[key] = { state, district, period, bio_5_18: 0, bio_18_greater: 0 };
        }
        bioGrouped[key].bio_5_18 += parseInt(r.bio_age_5_17) || 0;
        bioGrouped[key].bio_18_greater += parseInt(r.bio_age_17_) || 0;
      }

      for (const key of Object.keys(bioGrouped)) {
        const grp = bioGrouped[key];
        if (grp.bio_5_18 > 0) {
          biometricRecords.push({
            datasetId: bioDataset._id,
            state: grp.state,
            district: grp.district,
            type: 'update',
            ageBand: '5-18',
            period: grp.period,
            count: grp.bio_5_18
          });
        }
        if (grp.bio_18_greater > 0) {
          const u_18_35 = Math.floor(grp.bio_18_greater * 0.7);
          const u_35_60 = grp.bio_18_greater - u_18_35;
          if (u_18_35 > 0) {
            biometricRecords.push({
              datasetId: bioDataset._id,
              state: grp.state,
              district: grp.district,
              type: 'update',
              ageBand: '18-35',
              period: grp.period,
              count: u_18_35
            });
          }
          if (u_35_60 > 0) {
            biometricRecords.push({
              datasetId: bioDataset._id,
              state: grp.state,
              district: grp.district,
              type: 'update',
              ageBand: '35-60',
              period: grp.period,
              count: u_35_60
            });
          }
        }
      }
      bioDataset.rowCount = biometricRecords.length;
      await bioDataset.save();
    } else {
      console.warn(`Biometric dataset csv is not placed in the root directory: ${biometricFile}`);
    }

    // -- C. Enrolment Data --
    const enrolmentFile = path.join(rootDir, 'api_data_aadhar_enrolment_1000000_1006029.csv');
    if (fs.existsSync(enrolmentFile)) {
      const enrolRows = parseCSV(enrolmentFile);
      console.log(`Processing ${enrolRows.length} enrolment rows...`);
      const enrolGrouped = {};
      for (const r of enrolRows) {
        const period = convertDateToPeriod(r.date);
        if (!period) continue;
        const state = r.state.toLowerCase().trim();
        const district = r.district.toLowerCase().trim();
        const key = `${state}|${district}|${period}`;
        
        if (!enrolGrouped[key]) {
          enrolGrouped[key] = { state, district, period, age_0_5: 0, age_5_18: 0, age_18_greater: 0 };
        }
        enrolGrouped[key].age_0_5 += parseInt(r.age_0_5) || 0;
        enrolGrouped[key].age_5_18 += parseInt(r.age_5_17) || 0;
        enrolGrouped[key].age_18_greater += parseInt(r.age_18_greater) || 0;
      }

      let enrolCount = 0;
      for (const key of Object.keys(enrolGrouped)) {
        const grp = enrolGrouped[key];
        if (grp.age_0_5 > 0) {
          biometricRecords.push({ datasetId: enrolDataset._id, state: grp.state, district: grp.district, type: 'enrollment', ageBand: '0-5', period: grp.period, count: grp.age_0_5 });
          enrolCount++;
        }
        if (grp.age_5_18 > 0) {
          biometricRecords.push({ datasetId: enrolDataset._id, state: grp.state, district: grp.district, type: 'enrollment', ageBand: '5-18', period: grp.period, count: grp.age_5_18 });
          enrolCount++;
        }
        if (grp.age_18_greater > 0) {
          const e_18_35 = Math.floor(grp.age_18_greater * 0.7);
          const e_35_60 = grp.age_18_greater - e_18_35;
          if (e_18_35 > 0) {
            biometricRecords.push({ datasetId: enrolDataset._id, state: grp.state, district: grp.district, type: 'enrollment', ageBand: '18-35', period: grp.period, count: e_18_35 });
            enrolCount++;
          }
          if (e_35_60 > 0) {
            biometricRecords.push({ datasetId: enrolDataset._id, state: grp.state, district: grp.district, type: 'enrollment', ageBand: '35-60', period: grp.period, count: e_35_60 });
            enrolCount++;
          }
        }
      }
      enrolDataset.rowCount = enrolCount;
      await enrolDataset.save();
    } else {
      console.warn(`Enrolment dataset csv is not placed in the root directory: ${enrolmentFile}`);
    }

    if (biometricRecords.length > 0) {
      console.log(`Inserting ${biometricRecords.length} aggregated BiometricRecords to DB...`);
      await BiometricRecord.insertMany(biometricRecords);
    }


    // 6. SEED RESOURCE CATALOG & HISTORICAL ALLOCATIONS (12 consecutive months to feed Prophet ML engine)
    console.log('Seeding Resource Catalog...');
    const kitResource = await Resource.create({
      name: 'Aadhaar Enrollment Kits',
      unit: 'kits',
      description: 'Desktop configurations with camera, iris scanner, GPS and fingerprint devices'
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
    console.log('Resource Catalog created.');

    console.log('Generating 12-Month resource allocation timeline history...');
    
    // Core regions from frontend filters
    const regions = [
      { state: 'maharashtra', districts: ['mumbai_city', 'pune', 'nagpur', 'thane', 'nashik'] },
      { state: 'karnataka', districts: ['bengaluru_urban', 'mysuru', 'hubli-dharwad', 'mangaluru', 'belagavi'] },
      { state: 'uttar_pradesh', districts: ['lucknow', 'kanpur', 'varanasi', 'agra', 'ghaziabad'] },
      { state: 'tamil_nadu', districts: ['chennai', 'coimbatore', 'madurai', 'salem', 'trichy'] }
    ];

    // 12 months periods: Sep 2025 -> Aug 2026
    const periods = [
      '2025-09', '2025-10', '2025-11', '2025-12', 
      '2026-01', '2026-02', '2026-03', '2026-04', 
      '2026-05', '2026-06', '2026-07', '2026-08'
    ];

    const resourceAllocations = [];
    
    // Base parameters per state/district to generate realistic, trending time series
    // (e.g., Bengaluru has high count, Mumbai City has moderate, Lucknow has moderate, etc.)
    const baseDemand = {
      'maharashtra|mumbai_city': { kits: 30, scanners: 110, personnel: 60, trend: 1.05 },
      'maharashtra|pune': { kits: 24, scanners: 88, personnel: 48, trend: 1.04 },
      'maharashtra|nagpur': { kits: 15, scanners: 55, personnel: 30, trend: 1.02 },
      'maharashtra|thane': { kits: 28, scanners: 102, personnel: 56, trend: 1.05 },
      'maharashtra|nashik': { kits: 18, scanners: 66, personnel: 36, trend: 1.03 },

      'karnataka|bengaluru_urban': { kits: 45, scanners: 165, personnel: 90, trend: 1.06 },
      'karnataka|mysuru': { kits: 12, scanners: 44, personnel: 24, trend: 1.02 },
      'karnataka|hubli-dharwad': { kits: 10, scanners: 38, personnel: 20, trend: 1.01 },
      'karnataka|mangaluru': { kits: 8, scanners: 30, personnel: 16, trend: 1.03 },
      'karnataka|belagavi': { kits: 14, scanners: 50, personnel: 28, trend: 1.02 },

      'uttar_pradesh|lucknow': { kits: 25, scanners: 90, personnel: 50, trend: 1.04 },
      'uttar_pradesh|kanpur': { kits: 22, scanners: 82, personnel: 44, trend: 1.03 },
      'uttar_pradesh|varanasi': { kits: 18, scanners: 68, personnel: 36, trend: 1.02 },
      'uttar_pradesh|agra': { kits: 16, scanners: 60, personnel: 32, trend: 1.01 },
      'uttar_pradesh|ghaziabad': { kits: 28, scanners: 105, personnel: 58, trend: 1.05 },

      'tamil_nadu|chennai': { kits: 32, scanners: 118, personnel: 64, trend: 1.04 },
      'tamil_nadu|coimbatore': { kits: 20, scanners: 74, personnel: 40, trend: 1.03 },
      'tamil_nadu|madurai': { kits: 14, scanners: 52, personnel: 28, trend: 1.02 },
      'tamil_nadu|salem': { kits: 12, scanners: 45, personnel: 24, trend: 1.01 },
      'tamil_nadu|trichy': { kits: 10, scanners: 38, personnel: 20, trend: 1.01 }
    };

    for (const reg of regions) {
      for (const dist of reg.districts) {
        const key = `${reg.state}|${dist}`;
        const config = baseDemand[key] || { kits: 10, scanners: 35, personnel: 20, trend: 1.02 };
        
        periods.forEach((period, index) => {
          // Trend multiplier (grows month over month)
          const trendMultiplier = Math.pow(config.trend, index);
          
          // Add small seasonal noise (-5% to +5%)
          const noise = 0.95 + Math.random() * 0.10;
          
          // Calculate kit allocation
          const kitsAllocated = Math.max(1, Math.round(config.kits * trendMultiplier * noise));
          const kitsUtilized = Math.max(0, Math.round(kitsAllocated * (0.85 + Math.random() * 0.12)));
          
          resourceAllocations.push({
            datasetId: resourceDataset._id,
            resourceId: kitResource._id,
            state: reg.state,
            district: dist,
            period: period,
            allocatedAmount: kitsAllocated,
            utilizedAmount: Math.min(kitsAllocated, kitsUtilized),
            demandIndicator: kitsAllocated - Math.min(kitsAllocated, kitsUtilized)
          });

          // Calculate scanners allocation
          const scannersAllocated = Math.max(2, Math.round(config.scanners * trendMultiplier * noise));
          const scannersUtilized = Math.max(0, Math.round(scannersAllocated * (0.82 + Math.random() * 0.14)));
          
          resourceAllocations.push({
            datasetId: resourceDataset._id,
            resourceId: scannerResource._id,
            state: reg.state,
            district: dist,
            period: period,
            allocatedAmount: scannersAllocated,
            utilizedAmount: Math.min(scannersAllocated, scannersUtilized),
            demandIndicator: scannersAllocated - Math.min(scannersAllocated, scannersUtilized)
          });

          // Calculate personnel allocation
          const personnelAllocated = Math.max(1, Math.round(config.personnel * trendMultiplier * noise));
          const personnelUtilized = Math.max(0, Math.round(personnelAllocated * (0.88 + Math.random() * 0.10)));
          
          resourceAllocations.push({
            datasetId: resourceDataset._id,
            resourceId: personnelResource._id,
            state: reg.state,
            district: dist,
            period: period,
            allocatedAmount: personnelAllocated,
            utilizedAmount: Math.min(personnelAllocated, personnelUtilized),
            demandIndicator: personnelAllocated - Math.min(personnelAllocated, personnelUtilized)
          });
        });
      }
    }

    console.log(`Inserting ${resourceAllocations.length} historical ResourceAllocation rows to DB...`);
    await ResourceAllocation.insertMany(resourceAllocations);
    
    resourceDataset.rowCount = resourceAllocations.length;
    await resourceDataset.save();
    
    console.log('--- SEEDING COMPLETED SUCCESSFULY ---');
    process.exit(0);
    
  } catch (error) {
    console.error('Seeding process crashed:', error);
    process.exit(1);
  }
}

runSeed();
