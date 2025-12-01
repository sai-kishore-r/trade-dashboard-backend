import mongoose from "mongoose";

const chartLayoutSchema = new mongoose.Schema({
    name: { type: String, required: true },
    content: { type: String, required: true }, // Storing JSON string
    symbol: { type: String, required: true },
    resolution: { type: String, required: true },
    timestamp: { type: Number, required: true },
    client_id: { type: String, required: true },
    user_id: { type: String, required: true },
}, { timestamps: true });

const ChartLayoutModel = mongoose.model("ChartLayout", chartLayoutSchema);

export default ChartLayoutModel;
