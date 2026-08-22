const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Role = require('../models/Role');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes in this router
router.use(protect);

// @route   GET /api/v1/users
// @desc    List all personnel user accounts
// @access  Private (Admin only)
router.get('/', authorize('manage_users'), async (req, res) => {
  try {
    const users = await User.find()
      .populate('roleId', 'name permissions description')
      .select('-passwordHash'); // Exclude password hashes
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user list' });
  }
});

// @route   POST /api/v1/users
// @desc    Create/provision a new user account
// @access  Private (Admin only)
router.post('/', authorize('manage_users'), async (req, res) => {
  const { name, email, roleName, department, password } = req.body;

  if (!name || !email || !roleName || !department || !password) {
    return res.status(400).json({ error: 'Please provide name, email, role, department and a temporary password' });
  }

  try {
    // Check if user already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(409).json({ error: 'Account already provisioned with this government email' });
    }

    // Resolve Role ID
    const role = await Role.findOne({ name: roleName });
    if (!role) {
      return res.status(400).json({ error: `Assigned role [${roleName}] is invalid or not registered` });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create User
    const newUser = await User.create({
      name,
      email,
      passwordHash,
      roleId: role._id,
      department
    });

    // Log administrative action
    await AuditLog.create({
      userId: req.user._id,
      email: req.user.email,
      roleName: req.user.roleId.name,
      action: `Provisioned user account: ${name} (${email}) with role scope [${roleName}]`,
      targetType: 'User',
      targetId: newUser._id,
      ipAddress: req.ip || 'unknown',
      status: 'Success'
    });

    // Respond excluding password details
    res.status(201).json({
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: role.name,
      department: newUser.department,
      status: newUser.status
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'System error during user account provisioning' });
  }
});

// @route   PATCH /api/v1/users/:id
// @desc    Update user details or status
// @access  Private (Admin only)
router.patch('/:id', authorize('manage_users'), async (req, res) => {
  const { status, roleName, department } = req.body;

  try {
    const user = await User.findById(req.params.id).populate('roleId');
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Log the change description
    let changeDetails = '';

    if (status) {
      user.status = status;
      changeDetails += `status updated to [${status}]. `;
      if (status === 'active') {
        user.failedLoginAttempts = 0;
        user.lockUntil = undefined;
      }
    }

    if (department) {
      user.department = department;
      changeDetails += `department updated to [${department}]. `;
    }

    if (roleName) {
      const role = await Role.findOne({ name: roleName });
      if (!role) {
        return res.status(400).json({ error: `Assigned role [${roleName}] is invalid` });
      }
      user.roleId = role._id;
      changeDetails += `role changed to [${roleName}]. `;
    }

    await user.save();

    await AuditLog.create({
      userId: req.user._id,
      email: req.user.email,
      roleName: req.user.roleId.name,
      action: `Modified details for user account [${user.email}]: ${changeDetails.trim()}`,
      targetType: 'User',
      targetId: user._id,
      ipAddress: req.ip || 'unknown',
      status: 'Success'
    });

    res.status(200).json({ success: true, message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error updating user profile' });
  }
});

// @route   DELETE /api/v1/users/:id
// @desc    Soft-deactivate/suspend a user account
// @access  Private (Admin only)
router.delete('/:id', authorize('manage_users'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User account not found' });
    }

    user.status = 'inactive';
    await user.save();

    await AuditLog.create({
      userId: req.user._id,
      email: req.user.email,
      roleName: req.user.roleId.name,
      action: `Suspended user account: ${user.name} (${user.email}) - status set to inactive`,
      targetType: 'User',
      targetId: user._id,
      ipAddress: req.ip || 'unknown',
      status: 'Success'
    });

    res.status(200).json({ success: true, message: 'User account deactivated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error deactivating user account' });
  }
});

module.exports = router;
