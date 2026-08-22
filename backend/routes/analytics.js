const express = require('express');
const DemographicRecord = require('../models/DemographicRecord');
const BiometricRecord = require('../models/BiometricRecord');
const ResourceAllocation = require('../models/ResourceAllocation');
const Resource = require('../models/Resource');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply session security check to all analytics queries
router.use(protect);

// @route   GET /api/v1/analytics/demographics
// @desc    Retrieve aggregated demographic trend values
// @access  Private
router.get('/demographics', async (req, res) => {
  const { state, district, ageBand, gender } = req.query;

  try {
    const match = {};
    if (state && state !== 'all') match.state = state.toLowerCase();
    if (district && district !== 'all') match.district = district.toLowerCase();
    if (ageBand && ageBand !== 'all') match.ageBand = ageBand;
    if (gender && gender !== 'all') match.gender = gender.toUpperCase();

    // Aggregate trends grouped by period (month/year)
    const trends = await DemographicRecord.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$period',
          totalCount: { $sum: '$count' },
          maleCount: {
            $sum: { $cond: [{ $eq: ['$gender', 'M'] }, '$count', 0] }
          },
          femaleCount: {
            $sum: { $cond: [{ $eq: ['$gender', 'F'] }, '$count', 0] }
          },
          otherCount: {
            $sum: { $cond: [{ $eq: ['$gender', 'O'] }, '$count', 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Aggregate age bracket distributions
    const ageDistribution = await DemographicRecord.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$ageBand',
          count: { $sum: '$count' }
        }
      }
    ]);

    res.status(200).json({
      trends: trends.map(t => ({
        period: t._id,
        totalCount: t.totalCount,
        maleCount: t.maleCount,
        femaleCount: t.femaleCount,
        otherCount: t.otherCount
      })),
      ageDistribution: ageDistribution.map(ad => ({
        ageBand: ad._id,
        count: ad.count
      }))
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error compiling demographic data aggregations' });
  }
});

// @route   GET /api/v1/analytics/biometrics
// @desc    Retrieve aggregated biometric enrollment and update records
// @access  Private
router.get('/biometrics', async (req, res) => {
  const { state, district, ageBand } = req.query;

  try {
    const match = {};
    if (state && state !== 'all') match.state = state.toLowerCase();
    if (district && district !== 'all') match.district = district.toLowerCase();
    if (ageBand && ageBand !== 'all') match.ageBand = ageBand;

    const trends = await BiometricRecord.aggregate([
      { $match: match },
      {
        $group: {
          _id: { period: '$period', type: '$type' },
          count: { $sum: '$count' }
        }
      },
      { $sort: { '_id.period': 1 } }
    ]);

    // Reshape outputs for frontend consumption
    // output structure: [{period: '2026-01', enrollment: 540, update: 120}]
    const timeline = {};
    trends.forEach(item => {
      const period = item._id.period;
      const type = item._id.type; // 'enrollment' or 'update'
      if (!timeline[period]) {
        timeline[period] = { period, enrollmentCount: 0, updateCount: 0 };
      }
      if (type === 'enrollment') timeline[period].enrollmentCount = item.count;
      if (type === 'update') timeline[period].updateCount = item.count;
    });

    res.status(200).json(Object.values(timeline).sort((a, b) => a.period.localeCompare(b.period)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch biometric analytics aggregation records' });
  }
});

// @route   GET /api/v1/analytics/resources
// @desc    Retrieve resource allocation details, including capacity and utilization gaps
// @access  Private
router.get('/resources', async (req, res) => {
  const { state, district, resourceName } = req.query;

  try {
    const match = {};
    if (state && state !== 'all') match.state = state.toLowerCase();
    if (district && district !== 'all') match.district = district.toLowerCase();

    if (resourceName && resourceName !== 'all') {
      const resObj = await Resource.findOne({ name: resourceName });
      if (resObj) match.resourceId = resObj._id;
    }

    const allocations = await ResourceAllocation.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$period',
          allocated: { $sum: '$allocatedAmount' },
          utilized: { $sum: '$utilizedAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json(
      allocations.map(a => ({
        period: a._id,
        allocated: a.allocated,
        utilized: a.utilized,
        gap: Math.max(0, a.allocated - a.utilized),
        utilizationRate: a.allocated > 0 ? parseFloat(((a.utilized / a.allocated) * 100).toFixed(2)) : 0
      }))
    );
  } catch (err) {
    res.status(500).json({ error: 'Failed to compile resource utilization timelines' });
  }
});

module.exports = router;
