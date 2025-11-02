import express from "express";

const upstoxs = express.Router();

upstoxs.post("/upstoxs/notifier", (req, res) => {
  const { client_id, user_id, access_token, token_type, expires_at, issued_at, message_type } = req.body;

  if (!client_id || !user_id || !access_token) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  if (message_type !== "access_token") {
    return res.status(400).json({ success: false, error: `Unsupported message_type: ${message_type}` });
  }

  console.log("✅ Upstox Access Token Received:", { client_id, user_id, token_type, issued_at, expires_at });

  res.status(200).json({ success: true, message: "Access token received" });
});

export default upstoxs;
