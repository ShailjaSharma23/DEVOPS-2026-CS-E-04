const mongoose = require('mongoose');

const DemographicRecordSchema = new mongoose.Schema({
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
  ageBand: {
    type: String,
    required: true,
    enum: ['0-5', '5-18', '18-35', '35-60', '60+']
  },
  gender: {
    type: String,
    required: true,
    enum: ['M', 'F', 'O'] // Male, Female, Other
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

// Compound indexing for optimization
DemographicRecordSchema.index({ state: 1, district: 1, period: 1 });
DemographicRecordSchema.index({ datasetId: 1 });

module.exports = mongoose.model('DemographicRecord', DemographicRecordSchema);
