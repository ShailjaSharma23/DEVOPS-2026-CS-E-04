const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Role = require('../models/Role');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Generate Access Token (15m expiry)
const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      name: user.name, 
      role: user.roleId.name,
      permissions: user.roleId.permissions 
    },
    process.env.JWT_SECRET || 'astra_secret_key_123',
    { expiresIn: '15m' }
  );
};

// Generate Refresh Token (7d expiry)
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || 'astra_refresh_secret_key_456',
    { expiresIn: '7d' }
  );
};

// @route   POST /api/v1/auth/login
// @desc    Authenticate User & return token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password' });
  }

  try {
    const user = await User.findOne({ email }).populate('roleId');
    if (!user) {
      // Security: Avoid disclosing specific user existence check
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    // Check status lock
    if (user.status === 'locked') {
      if (user.lockUntil && user.lockUntil > Date.now()) {
        return res.status(423).json({ error: 'Account is temporarily locked. Try again later.' });
      } else {
        // Cooldown time expired, unlock
        user.status = 'active';
        user.failedLoginAttempts = 0;
        await user.save();
      }
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ error: 'User account has been deactivated.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      
      // Lock account after 5 failed attempts
      if (user.failedLoginAttempts >= 5) {
        user.status = 'locked';
        user.lockUntil = Date.now() + 15 * 60 * 1000; // 15 minutes lock
        await user.save();
        
        await AuditLog.create({
          email: email,
          roleName: user.roleId.name,
          action: 'Brute-force alert: Account locked due to 5 consecutive failed login attempts',
          ipAddress: req.ip || 'unknown',
          status: 'Failed'
        });

        return res.status(423).json({ error: 'Account locked due to consecutive failures. Try again in 15 mins.' });
      }

      await user.save();

      // Log failure
      await AuditLog.create({
        email: email,
        roleName: user.roleId.name,
        action: `Failed authentication attempt (Count: ${user.failedLoginAttempts})`,
        ipAddress: req.ip || 'unknown',
        status: 'Failed'
      });

      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    // Reset login failures on success
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    // Create tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Audit Log success
    await AuditLog.create({
      userId: user._id,
      email: user.email,
      roleName: user.roleId.name,
      action: 'User session authenticated successfully via JWT gateway',
      ipAddress: req.ip || 'unknown',
      status: 'Success'
    });

    res.status(200).json({
      token: accessToken,
      refreshToken: refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.roleId.name,
        department: user.department
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during authentication execution' });
  }
});

// @route   POST /api/v1/auth/logout
// @desc    Logout user & invalidate session
// @access  Private
router.post('/logout', protect, async (req, res) => {
  try {
    await AuditLog.create({
      userId: req.user._id,
      email: req.user.email,
      roleName: req.user.roleId.name,
      action: 'User session explicitly closed (Logged Out)',
      ipAddress: req.ip || 'unknown',
      status: 'Success'
    });

    res.status(200).json({ success: true, message: 'Session invalidated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error during logout audit processing' });
  }
});

// @route   POST /api/v1/auth/refresh
// @desc    Refresh session access token
// @access  Public
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token missing' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'astra_refresh_secret_key_456');
    const user = await User.findById(decoded.id).populate('roleId');

    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Invalid or suspended user session' });
    }

    const newAccessToken = generateAccessToken(user);
    res.status(200).json({ token: newAccessToken });
  } catch (err) {
    res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
});

// @route   GET /api/v1/auth/session
// @desc    Validate session token and return context
// @access  Private
router.get('/session', protect, (req, res) => {
  res.status(200).json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.roleId.name,
      permissions: req.user.roleId.permissions,
      department: req.user.department
    }
  });
});

module.exports = router;
