import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/upstox/token', async (req, res) => {
  const { code, redirectUri } = req.body;
  const clientId = process.env.UPSTOX_CLIENT_ID;
  const clientSecret = process.env.UPSTOX_CLIENT_SECRET;

  try {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirectUri);
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);

    const response = await axios.post('https://api.upstox.com/index/oauth/token', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
