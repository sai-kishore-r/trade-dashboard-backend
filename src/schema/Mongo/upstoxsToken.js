import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
  client_id: { type: String, required: true },
  user_id: { type: String, required: true },
  access_token: { type: String, required: true },
  expires_at: { type: Date, required: true },
  issued_at: { type: Date, required: true },
});
const TokenModel = mongoose.model("upstoxs_token", tokenSchema)

export default TokenModel;
