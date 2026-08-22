const mongoose = require('mongoose');

const ForecastSchema = new mongoose.Schema({
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: true
  },
  state: {
    type: String,
    required: true,
    lowercase: true
  },
  district: {
    type: String,
    required: true,
    lowercase: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  horizon: {
    type: Number, // In months, e.g. 6 or 12
    required: true
  },
  predictions: [{
    period: { type: String, required: true }, // format YYYY-MM
    predictedValue: { type: Number, required: true },
    lowerBound: { type: Number, required: true },
    upperBound: { type: Number, required: true }
  }],
  modelMetadata: {
    algorithm: { type: String, default: 'Prophet' },
    version: { type: String, default: '1.2.0' },
    mae: { type: Number },
    rmse: { type: Number },
    mape: { type: Number }
  }
}, {
  timestamps: true
});

ForecastSchema.index({ state: 1, district: 1, resourceId: 1 });

module.exports = mongoose.model('Forecast', ForecastSchema);
