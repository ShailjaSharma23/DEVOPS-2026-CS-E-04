const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const AuditLog = require('../models/AuditLog');

// Authenticate JWT Token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized to access this route, token missing' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'astra_secret_key_123');

    // Get user from database
    const user = await User.findById(decoded.id).populate('roleId');
    if (!user) {
      return res.status(401).json({ error: 'User associated with token no longer exists' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'User account is locked or deactivated' });
    }

    // Attach user information to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token verification failed or expired' });
  }
};

// Authorize based on Permissions (RBAC)
const authorize = (requiredPermission) => {
  return async (req, res, next) => {
    if (!req.user || !req.user.roleId) {
      return res.status(403).json({ error: 'Access forbidden: Role permissions not resolved' });
    }

    const { permissions, name: roleName } = req.user.roleId;

    // Check if required permission exists in user's role permissions array
    if (!permissions.includes(requiredPermission)) {
      // Security violation - Log to Audit Trail
      await AuditLog.create({
        userId: req.user._id,
        email: req.user.email,
        roleName: roleName,
        action: `Security violation: Unauthorized attempt to access permission level [${requiredPermission}]`,
        targetType: 'API_Route',
        ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
        status: 'Failed'
      });

      return res.status(403).json({ error: `Access forbidden: Required permission [${requiredPermission}] is missing` });
    }

    next();
  };
};

module.exports = { protect, authorize };
