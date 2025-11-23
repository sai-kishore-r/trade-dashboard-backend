import express from "express";
import { connectWsUpstoxs } from "../ws/index.js";
import { intiateAccessTokenReq } from "../ws/utils.js";
import dbWrapper from "../utils/dbWrapper.js";

const upstoxs = express.Router();

upstoxs.get("/upstoxs/initiate-token", async (req, res) => {
  intiateAccessTokenReq();

  res.status(200).json({ success: true, message: "Token initiation triggered" });
});

upstoxs.post("/upstoxs/notifier", async (req, res) => {
  const { client_id, user_id, access_token, token_type, expires_at, issued_at, message_type } = req.body;

  if (!client_id || !user_id || !access_token) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  if (message_type !== "access_token") {
    return res.status(400).json({ success: false, error: `Unsupported message_type: ${message_type}` });
  }

  //TODO: Replace with logger.
  console.log("✅ Upstox Access Token Received:", { client_id, user_id, token_type, issued_at, expires_at });

  try {
    await dbWrapper.upsertTokenToDB({
      clientId: client_id,
      userId: user_id,
      accessToken: access_token,
      issuedAt: issued_at,
      expiresAt: expires_at
    });
  }
  catch (err) {
    console.log('error upsertTokenToDB', err)
  }
  connectWsUpstoxs(access_token);

  res.status(200).json({ success: true, message: "Access token received" });
});

export default upstoxs;
