import express from 'express';

const health = express.Router();

health.get('/api/health', (req, res) => {
  console.log('/api/health', new Date());
  
  res.json({
    status: 'OK',
    message: 'Your API is running',
    timestamp: new Date().toISOString()
  });
});

export default health;
