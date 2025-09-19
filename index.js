import serverlessExpress from '@vendia/serverless-express';
import app from './src/app.js'; // move your Express app code (without listen) to app.js

export const handler = serverlessExpress({ app });
