import mongoose from 'mongoose';

const ScanSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    index: true,
  },
  scanType: {
    type: String,
    required: true, // e.g. "new_high", "volume_spike"
  },
  date: {
    type: String,
    required: true, // YYYY-MM-DD format for the trading day
  },
  tradingSymbol: {
    type: String,
    required: false,
  },
  extraData: {
    type: mongoose.Schema.Types.Mixed, // flexible JSON structure for additional scan data like OHLC, volume etc.
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Compound index to ensure one scan per symbol, scanType and date
ScanSchema.index({ symbol: 1, scanType: 1, date: 1 }, { unique: true });

const Scan = mongoose.model("Scan", ScanSchema);

export default Scan;
