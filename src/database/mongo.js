// src/database/mongoConnection.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/trade-dashboard';
console.log(MONGODB_URI, 'MONGODB_URI')

class MongoConnection {
  constructor() {
    this.connection = null;
  }

  async connect() {
    if (this.connection) {
      // Return existing connection if already connected
      return this.connection;
    }

    try {
      this.connection = await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('MongoDB connected successfully');
      return this.connection;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      process.exit(1);
    }
  }
}

const mongoConnectionInstance = new MongoConnection();
export default mongoConnectionInstance;
