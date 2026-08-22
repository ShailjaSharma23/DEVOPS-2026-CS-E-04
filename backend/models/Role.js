const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['Administrator', 'Data Analyst', 'Resource Planning Officer', 'Department Officer']
  },
  permissions: [{
    type: String,
    required: true
  }],
  description: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Role', RoleSchema);
