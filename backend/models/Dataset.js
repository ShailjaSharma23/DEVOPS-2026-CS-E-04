const mongoose = require('mongoose');

const DatasetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['demographic', 'biometric', 'resource']
  },
  sourceFileName: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Uploaded', 'Validating', 'Processing', 'Ready', 'Failed', 'Archived'],
    default: 'Uploaded'
  },
  version: {
    type: Number,
    default: 1
  },
  qualityScore: {
    type: Number,
    default: 100.0 // Percentage of valid parsed rows
  },
  rowCount: {
    type: Number,
    default: 0
  },
  validationSummary: {
    errorCount: { type: Number, default: 0 },
    warningCount: { type: Number, default: 0 },
    messages: [{ type: String }]
  }
}, {
  timestamps: true
});

// Indexing for faster history lookups
DatasetSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model('Dataset', DatasetSchema);
