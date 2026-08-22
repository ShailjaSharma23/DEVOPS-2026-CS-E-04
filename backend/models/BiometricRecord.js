const mongoose = require('mongoose');

const BiometricRecordSchema = new mongoose.Schema({
  datasetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dataset',
    required: true
  },
  state: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  district: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['enrollment', 'update']
  },
  ageBand: {
    type: String,
    required: true,
    enum: ['0-5', '5-18', '18-35', '35-60', '60+']
  },
  period: {
    type: String, // format YYYY-MM
    required: true
  },
  count: {
    type: Number,
    required: true,
    min: 0
  }
});

BiometricRecordSchema.index({ state: 1, district: 1, period: 1, type: 1 });
BiometricRecordSchema.index({ datasetId: 1 });

module.exports = mongoose.model('BiometricRecord', BiometricRecordSchema);
