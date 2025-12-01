import mongoose from "mongoose";

const scanCriteriaSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
    },
    criteria: {
        type: Object, // JSON structure for rules
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

scanCriteriaSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const ScanCriteria = mongoose.model("ScanCriteria", scanCriteriaSchema);

export default ScanCriteria;
