import dotenv from 'dotenv';
import UpstoxClient from "upstox-js-sdk";

dotenv.config();

export const intiateAccessTokenReq = () => {
    console.log('🔄 Initiating access token request to Upstox...');
    try {
        const clientId = process.env.UPSTOXS_CLIENT_ID;
        const clientSecret = process.env.UPSTOXS_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            console.error('❌ Missing required environment variables:');
            if (!clientId) console.error(' - UPSTOXS_CLIENT_ID');
            if (!clientSecret) console.error(' - UPSTOXS_CLIENT_SECRET');

            return;
        }

        const apiInstance = new UpstoxClient.LoginApi();
        const body = new UpstoxClient.IndieUserTokenRequest();
        body.clientSecret = clientSecret;

        apiInstance.initTokenRequestForIndieUser(body, clientId, (error, data, response) => {
            if (error) {
                console.error('❌ Upstox API Error:');
                if (error.response?.text) {
                    console.error('Response:', error.response.text);
                } else {
                    console.error(error);
                }
            } else if (!data) {
                console.error('❌ No data received from Upstox API.');
            } else {
                console.log('✅ API called successfully.');
                console.log('Returned data:', JSON.stringify(data, null, 2));
            }
        });
    } catch (err) {
        console.error('❌ Unexpected error during token initiation:', err.message);
    };
};