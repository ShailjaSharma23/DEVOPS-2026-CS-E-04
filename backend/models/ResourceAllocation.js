const mongoose = require('mongoose');

const ResourceAllocationSchema = new mongoose.Schema({
  datasetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dataset',
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
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
  period: {
    type: String, // format YYYY-MM
    required: true
  },
  allocatedAmount: {
    type: Number,
    required: true,
    min: 0
  },
  utilizedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  demandIndicator: {
    type: Number, // allocation deficiency score or usage index
    default: 0
  }
});

ResourceAllocationSchema.index({ state: 1, district: 1, period: 1, resourceId: 1 });
ResourceAllocationSchema.index({ datasetId: 1 });

module.exports = mongoose.model('ResourceAllocation', ResourceAllocationSchema);
