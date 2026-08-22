const express = require('express');
const ResourceAllocation = require('../models/ResourceAllocation');
const Resource = require('../models/Resource');
const Forecast = require('../models/Forecast');
const AuditLog = require('../models/AuditLog');
const MLClient = require('../services/mlClient');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// @route   POST /api/v1/forecasts
// @desc    Generate resource requirements demand forecast
// @access  Private (Planning Officer and Admin only)
router.post('/', authorize('generate_forecasts'), async (req, res) => {
  const { resourceName, state, district, horizon } = req.body;

  if (!resourceName || !state || !district) {
    return res.status(400).json({ error: 'Please provide resourceName, state, and district fields' });
  }

  const forecastHorizon = parseInt(horizon) || 6;

  try {
    // 1. Resolve Resource Object
    const resource = await Resource.findOne({ name: resourceName });
    if (!resource) {
      return res.status(400).json({ error: `Resource type [${resourceName}] is not registered in catalog` });
    }

    // 2. Fetch historical allocations timeline for target region
    const history = await ResourceAllocation.find({
      resourceId: resource._id,
      state: state.toLowerCase(),
      district: district.toLowerCase()
    }).sort({ period: 1 });

    // 3. Pre-check: Minimum data points verification
    if (history.length < 6) {
      return res.status(422).json({
        error: `Insufficient historical data to initialize forecasting. Active points: ${history.length}. Minimum required: 6 monthly blocks.`
      });
    }

    // 4. Transform records for ML client ingestion
    const formattedHistory = history.map(h => ({
      period: h.period,
      value: h.allocatedAmount
    }));

    // 5. Send payload to ML service wrapper
    const forecastResult = await MLClient.generateForecast(formattedHistory, forecastHorizon);

    // 6. Persist results in MongoDB Forecast collection
    const newForecast = await Forecast.create({
      resourceId: resource._id,
      state: state.toLowerCase(),
      district: district.toLowerCase(),
      generatedBy: req.user._id,
      horizon: forecastHorizon,
      predictions: forecastResult.predictions,
      modelMetadata: {
        algorithm: forecastResult.metadata.algorithm,
        version: '1.2.0',
        mae: forecastResult.metadata.mae,
        rmse: forecastResult.metadata.rmse,
        mape: forecastResult.metadata.mape
      }
    });

    // 7. Audit log creation
    await AuditLog.create({
      userId: req.user._id,
      email: req.user.email,
      roleName: req.user.roleId.name,
      action: `Executed demand forecasting model for region [${state}/${district}] on [${resourceName}] (${forecastResult.metadata.algorithm})`,
      targetType: 'Forecast',
      targetId: newForecast._id,
      ipAddress: req.ip || 'unknown',
      status: 'Success'
    });

    res.status(201).json({
      success: true,
      forecastId: newForecast._id,
      predictions: newForecast.predictions,
      metadata: newForecast.modelMetadata,
      history: formattedHistory
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'System crash during forecasting pipeline calculations' });
  }
});

// @route   GET /api/v1/forecasts
// @desc    List past generated forecasts history
// @access  Private
router.get('/', async (req, res) => {
  const { state, district } = req.query;

  try {
    const match = {};
    if (state && state !== 'all') match.state = state.toLowerCase();
    if (district && district !== 'all') match.district = district.toLowerCase();

    const forecasts = await Forecast.find(match)
      .populate('resourceId', 'name unit')
      .populate('generatedBy', 'name email department')
      .sort({ createdAt: -1 });

    res.status(200).json(forecasts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve forecast runs history' });
  }
});

// @route   GET /api/v1/forecasts/:id
// @desc    Retrieve details of specific forecast run
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const forecast = await Forecast.findById(req.params.id)
      .populate('resourceId', 'name unit')
      .populate('generatedBy', 'name email department');
      
    if (!forecast) {
      return res.status(404).json({ error: 'Forecast profile not found' });
    }
    res.status(200).json(forecast);
  } catch (err) {
    res.status(500).json({ error: 'Server error retrieving forecast profile' });
  }
});

module.exports = router;
