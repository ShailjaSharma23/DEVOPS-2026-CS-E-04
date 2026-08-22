const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  unit: {
    type: String,
    required: true,
    enum: ['kits', 'scanners', 'units', 'centers']
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Resource', ResourceSchema);
