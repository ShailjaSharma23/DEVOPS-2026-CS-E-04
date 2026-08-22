const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Null if system event or failed login attempt
  },
  email: {
    type: String,
    required: true
  },
  roleName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  targetType: {
    type: String
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  },
  status: {
    type: String,
    enum: ['Success', 'Failed'],
    default: 'Success'
  }
}, {
  timestamps: true
});

AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
