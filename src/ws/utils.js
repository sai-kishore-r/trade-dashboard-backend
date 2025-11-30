import dotenv from 'dotenv';
import UpstoxClient from "upstox-js-sdk";

dotenv.config();

export const intiateAccessTokenReq = (code, config, callback) => {
    console.log(`🔄 Initiating access token request to Upstox for config: ${config.name}...`);
    try {
        const clientId = config.clientId;
        const clientSecret = config.clientSecret;
        const redirectUri = config.redirectUri;

        if (!clientId || !clientSecret) {
            console.error('❌ Missing required configuration:');
            if (!clientId) console.error(' - clientId');
            if (!clientSecret) console.error(' - clientSecret');
            return;
        }

        const apiInstance = new UpstoxClient.LoginApi();
        const body = new UpstoxClient.IndieUserTokenRequest();
        body.clientSecret = clientSecret;
        body.code = code;
        body.redirectUri = redirectUri;
        body.grantType = "authorization_code";

        apiInstance.token(body, clientId, (error, data, response) => {
            if (error) {
                console.error('❌ Upstox API Error:');
                if (error.response?.text) {
                    console.error('Response:', error.response.text);
                } else {
                    console.error(error);
                }
                if (callback) callback(error, null);
            } else if (!data) {
                console.error('❌ No data received from Upstox API.');
                if (callback) callback(new Error('No data received'), null);
            } else {
                console.log('✅ API called successfully.');
                // console.log('Returned data:', JSON.stringify(data, null, 2));
                if (callback) callback(null, data);
            }
        });
    } catch (err) {
        console.error('❌ Unexpected error during token initiation:', err.message);
        if (callback) callback(err, null);
    };
};