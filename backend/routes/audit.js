const express = require('express');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// @route   GET /api/v1/audit/logs
// @desc    Retrieve security and operations audit logs
// @access  Private (Admin only)
router.get('/logs', authorize('view_audit_logs'), async (req, res) => {
  const { search, roleName, page = 1, limit = 50 } = req.query;

  try {
    const match = {};

    // Filter by role
    if (roleName && roleName !== 'all') {
      match.roleName = { $regex: new RegExp(roleName, 'i') };
    }

    // Free text search in action description or email
    if (search) {
      match.$or = [
        { action: { $regex: new RegExp(search, 'i') } },
        { email: { $regex: new RegExp(search, 'i') } }
      ];
    }

    const skipped = (parseInt(page) - 1) * parseInt(limit);

    const logs = await AuditLog.find(match)
      .sort({ createdAt: -1 })
      .skip(skipped)
      .limit(parseInt(limit));

    const totalLogs = await AuditLog.countDocuments(match);

    res.status(200).json({
      logs,
      pagination: {
        totalItems: totalLogs,
        totalPages: Math.ceil(totalLogs / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve operation audit logs' });
  }
});

module.exports = router;
