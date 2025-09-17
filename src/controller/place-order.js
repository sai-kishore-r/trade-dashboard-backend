import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/place-order', async (req, res) => {
    try {
        const accessToken = req.headers.authorization; // Expect "Bearer <token>"
        if (!accessToken) {
            return res.status(401).json({ error: 'Missing Authorization header' });
        }

        const orderPayload = req.body;

        if (!orderPayload || !orderPayload.instrument_token || !orderPayload.quantity) {
            return res.status(400).json({ error: 'Invalid order payload' });
        }

        const response = await axios.post(
            'https://api.upstox.com/place-order',
            orderPayload,
            {
                headers: {
                    Authorization: accessToken,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
            }
        );

        const gttTriggerPrice = orderPayload.exit_price || orderPayload.sl; // exit price / stop loss price
        const quantityBought = orderPayload.quantity;
        const instrumentToken = orderPayload.instrument_token;
        const product = 'D';
        const transactionType = 'SELL'; // Typically GTT stop loss is opposite side of the buy

        const gttPayload = {
            type: "SINGLE",
            quantity: quantityBought,
            product: product,
            rules: [
                {
                    strategy: "ENTRY",
                    trigger_type: "BELOW",      // since stop loss triggers when price falls below exit price
                    trigger_price: gttTriggerPrice,
                }
            ],
            instrument_token: instrumentToken,
            transaction_type: transactionType,
        };

        // Place GTT order using Upstox GTT API
        const gttResponse = await axios.post(
            'https://api.upstox.com/v3/order/gtt/place',
            gttPayload,
            {
                headers: {
                    Authorization: accessToken,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                }
            }
        );

        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error placing order:', error.response ? error.response.data : error.message);
        const status = error.response ? error.response.status : 500;
        const message = error.response ? error.response.data : { error: 'Internal server error' };
        res.status(status).json(message);
    }
});

export default router;
