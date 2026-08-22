const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide full name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide government email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please fill a valid email address'
    ]
  },
  passwordHash: {
    type: String,
    required: [true, 'Please provide hashed password']
  },
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  department: {
    type: String,
    required: [true, 'Please specify government department'],
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'locked'],
    default: 'active'
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  lastLoginAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
