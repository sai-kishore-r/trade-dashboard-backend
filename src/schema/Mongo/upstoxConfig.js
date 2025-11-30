import mongoose from "mongoose";

const upstoxConfigSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    clientId: { type: String, required: true },
    clientSecret: { type: String, required: true },
    redirectUri: { type: String, required: true },
    userId: { type: String, required: true },
}, { timestamps: true });

const UpstoxConfigModel = mongoose.model("UpstoxConfig", upstoxConfigSchema);

export default UpstoxConfigModel;
