import axios from 'axios';

const upstoxAuth = async (req, res) => {
  const { code } = req.body;
  const apiKey = process.env.UPSTOX_API_KEY;
  const apiSecret = process.env.UPSTOX_API_SECRET;
  const redirectUri = process.env.UPSTOX_REDIRECT_URI; // e.g., http://localhost:5173/redirect

  if (!code) {
    return res.status(400).json({ error: 'Authorization code is missing' });
  }

  try {
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('client_id', apiKey);
    params.append('client_secret', apiSecret);
    params.append('redirect_uri', redirectUri);
    params.append('grant_type', 'authorization_code');

    const response = await axios.post('https://api.upstox.com/v2/login/authorization/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    });

    const { access_token } = response.data;

    // Return the token to the frontend
    res.json({ access_token });
  } catch (error) {
    console.error('Error exchanging code for token:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to authenticate with Upstox' });
  }
};

export { upstoxAuth };
