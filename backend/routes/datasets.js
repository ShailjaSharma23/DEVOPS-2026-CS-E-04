const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Dataset = require('../models/Dataset');
const DemographicRecord = require('../models/DemographicRecord');
const BiometricRecord = require('../models/BiometricRecord');
const Resource = require('../models/Resource');
const ResourceAllocation = require('../models/ResourceAllocation');
const AuditLog = require('../models/AuditLog');
const ValidationService = require('../services/validationService');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Setup file upload storage directory
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limits
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are supported for ingestion'));
    }
  }
});

router.use(protect);

// @route   POST /api/v1/datasets/upload
// @desc    Upload new dataset raw data file
// @access  Private (Analyst & Admin only)
router.post('/upload', authorize('upload_datasets'), upload.single('file'), async (req, res) => {
  const { category, name } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'Please upload a CSV file' });
  }

  if (!category || !['demographic', 'biometric', 'resource'].includes(category)) {
    // Delete temp file
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'Please specify a valid category: demographic, biometric, or resource' });
  }

  const datasetName = name || req.file.originalname;

  try {
    // Create dataset record
    const dataset = await Dataset.create({
      name: datasetName,
      category,
      sourceFileName: req.file.filename,
      uploadedBy: req.user._id,
      status: 'Uploaded'
    });

    // Fire off asynchronous validation and aggregation job
    // This allows the server to respond immediately without locking client requests
    setImmediate(() => processDatasetJob(dataset._id, req.file.path, category, req.user));

    await AuditLog.create({
      userId: req.user._id,
      email: req.user.email,
      roleName: req.user.roleId.name,
      action: `Initiated dataset file upload: ${datasetName} (ID: ${dataset._id})`,
      targetType: 'Dataset',
      targetId: dataset._id,
      ipAddress: req.ip || 'unknown',
      status: 'Success'
    });

    res.status(202).json({
      message: 'File uploaded successfully, parsing and verification started in background.',
      datasetId: dataset._id,
      status: dataset.status
    });

  } catch (err) {
    console.error(err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'System error during upload scheduling' });
  }
});

// @route   GET /api/v1/datasets
// @desc    List all uploaded datasets
// @access  Private (All users)
router.get('/', async (req, res) => {
  try {
    const datasets = await Dataset.find()
      .populate('uploadedBy', 'name email department')
      .sort({ createdAt: -1 });
    res.status(200).json(datasets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dataset repository list' });
  }
});

// @route   GET /api/v1/datasets/:id
// @desc    Get dataset metadata details & validation errors
// @access  Private (All users)
router.get('/:id', async (req, res) => {
  try {
    const dataset = await Dataset.findById(req.params.id).populate('uploadedBy', 'name email department');
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset record not found' });
    }
    res.status(200).json(dataset);
  } catch (err) {
    res.status(500).json({ error: 'Server error retrieving dataset detail' });
  }
});

// @route   GET /api/v1/datasets/:id/status
// @desc    Poll/check parsing status of a dataset
// @access  Private (All users)
router.get('/:id/status', async (req, res) => {
  try {
    const dataset = await Dataset.findById(req.params.id).select('status rowCount validationSummary qualityScore');
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    res.status(200).json(dataset);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

// @route   DELETE /api/v1/datasets/:id
// @desc    Archive a dataset and cascade-delete its records
// @access  Private (Admin only)
router.delete('/:id', authorize('manage_datasets'), async (req, res) => {
  try {
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset record not found' });
    }

    dataset.status = 'Archived';
    await dataset.save();

    // Cascading deletion of records in background
    if (dataset.category === 'demographic') {
      await DemographicRecord.deleteMany({ datasetId: dataset._id });
    } else if (dataset.category === 'biometric') {
      await BiometricRecord.deleteMany({ datasetId: dataset._id });
    } else if (dataset.category === 'resource') {
      await ResourceAllocation.deleteMany({ datasetId: dataset._id });
    }

    // Delete physically stored file
    const filePath = path.join(uploadDir, dataset.sourceFileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await AuditLog.create({
      userId: req.user._id,
      email: req.user.email,
      roleName: req.user.roleId.name,
      action: `Archived dataset: ${dataset.name} and purged all associated raw rows`,
      targetType: 'Dataset',
      targetId: dataset._id,
      ipAddress: req.ip || 'unknown',
      status: 'Success'
    });

    res.status(200).json({ success: true, message: 'Dataset archived and purged from analytical metrics' });
  } catch (err) {
    res.status(500).json({ error: 'Server error purging dataset records' });
  }
});

/* ----------------------------------------------------
   Asynchronous Ingest Parsing Job
   ---------------------------------------------------- */
async function processDatasetJob(datasetId, filePath, category, user) {
  try {
    // 1. Update status to Validating
    await Dataset.findByIdAndUpdate(datasetId, { status: 'Validating' });

    // 2. Run validations
    const valResult = await ValidationService.validateCSV(filePath, category);

    if (!valResult.isValid) {
      await Dataset.findByIdAndUpdate(datasetId, {
        status: 'Failed',
        qualityScore: valResult.qualityScore,
        rowCount: valResult.rowCount,
        validationSummary: {
          errorCount: valResult.errorCount,
          warningCount: valResult.warningCount,
          messages: valResult.messages
        }
      });

      await AuditLog.create({
        email: user.email,
        roleName: user.roleId.name,
        action: `Schema validation failed for dataset file. Purged pipeline.`,
        targetType: 'Dataset',
        targetId: datasetId,
        status: 'Failed'
      });

      // Cleanup corrupted/failed file
      fs.unlinkSync(filePath);
      return;
    }

    // 3. Update status to Processing
    await Dataset.findByIdAndUpdate(datasetId, {
      status: 'Processing',
      rowCount: valResult.rowCount,
      qualityScore: valResult.qualityScore
    });

    // 4. Ingest and aggregate rows into MongoDB database
    if (category === 'demographic') {
      const dbRows = valResult.validRows.map(row => ({
        datasetId: datasetId,
        state: row.state.toLowerCase(),
        district: row.district.toLowerCase(),
        ageBand: row.age_band,
        gender: row.gender.toUpperCase(),
        period: row.period,
        count: parseInt(row.count)
      }));
      await DemographicRecord.insertMany(dbRows);
    } 
    
    else if (category === 'biometric') {
      const dbRows = valResult.validRows.map(row => ({
        datasetId: datasetId,
        state: row.state.toLowerCase(),
        district: row.district.toLowerCase(),
        type: row.type.toLowerCase(),
        ageBand: row.age_band,
        period: row.period,
        count: parseInt(row.count)
      }));
      await BiometricRecord.insertMany(dbRows);
    } 
    
    else if (category === 'resource') {
      for (const row of valResult.validRows) {
        // Resolve or create Resource catalog items dynamically
        let resourceObj = await Resource.findOne({ name: row.resource_name });
        if (!resourceObj) {
          // Identify unit
          let unit = 'units';
          const nameLower = row.resource_name.toLowerCase();
          if (nameLower.includes('kit')) unit = 'kits';
          else if (nameLower.includes('scanner') || nameLower.includes('iris')) unit = 'scanners';
          else if (nameLower.includes('center') || nameLower.includes('office')) unit = 'centers';

          resourceObj = await Resource.create({
            name: row.resource_name,
            unit,
            description: `Auto-generated item for ${row.resource_name}`
          });
        }

        // Write allocation record
        await ResourceAllocation.create({
          datasetId: datasetId,
          resourceId: resourceObj._id,
          state: row.state.toLowerCase(),
          district: row.district.toLowerCase(),
          period: row.period,
          allocatedAmount: parseInt(row.allocated),
          utilizedAmount: parseInt(row.utilized),
          demandIndicator: parseInt(row.allocated) - parseInt(row.utilized) // gap representation
        });
      }
    }

    // 5. Set status to Ready
    await Dataset.findByIdAndUpdate(datasetId, { 
      status: 'Ready',
      validationSummary: { errorCount: 0, warningCount: 0, messages: [] }
    });

    await AuditLog.create({
      email: user.email,
      roleName: user.roleId.name,
      action: `Completed ingestion job: Ingested and stored ${valResult.rowCount} aggregate rows (ID: ${datasetId})`,
      targetType: 'Dataset',
      targetId: datasetId,
      status: 'Success'
    });

  } catch (err) {
    console.error('Failure processing dataset background ingest:', err);
    await Dataset.findByIdAndUpdate(datasetId, {
      status: 'Failed',
      'validationSummary.messages': [`Server background critical processing error: ${err.message}`]
    });
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}

module.exports = router;
