// dbWrapper.js

import Instrument52WeekStatsSQL from '../schema/RDB/instrument52WStats.js'; // Sequelize model
import Instrument52WeekStatsMongo from '../schema/Mongo/instrument52WStats.js'; // Mongoose model (example)
import MarketBreadthSQL from '../schema/RDB/marketBreath.js';
import MarketBreadthMongo from '../schema/Mongo/marketBreadth.js';
import ScansSql from '../schema/RDB/scans.js';
import ScansMongo from '../schema/Mongo/scans.js';
import UpstoxsTokenMongo from '../schema/Mongo/upstoxsToken.js';
import UpstoxTokenSQL from '../schema/RDB/upstoxsToken.js';
import { sequelize } from '../database/index.js';
import dotenv from 'dotenv';
dotenv.config();

const USE_MONGO = process.env.USE_MONGO === 'true';

async function upsertInstrument52WeekStats(data) {
  try {
    if (USE_MONGO) {
      // Transform data for MongoDB schema if needed
      const query = { instrumentKey: data.instrumentKey };
      const update = {
        $set: {
          tradingsymbol: data.tradingsymbol,
          lastSyncDate: data.lastSyncDate,
          fiftyTwoWeekHigh: data.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: data.fiftyTwoWeekLow,
          lastPrice: data.lastPrice,
          ema10: data.ema10,
          ema21: data.ema21,
          ema50: data.ema50,
          avgVolume21d: data.avgVolume21d,
          lastUpdated: data.lastUpdated || new Date(),
          prevDayVolume: data.prevDayVolume,
          avgValueVolume21d: data.avgValueVolume21d,
          minVolume3d: data.minVolume3d,
          trendIntensity: data.trendIntensity,
          closePrev1: data.closePrev1,
          closePrev2: data.closePrev2,
          avgClose126d: data.avgClose126d,
          priceChange: data.priceChange,
        },
      };
      const options = { upsert: true, new: true };
      return await Instrument52WeekStatsMongo.findOneAndUpdate(query, update, options);
    } else {
      // Sequelize upsert
      await sequelize.sync();

      return await Instrument52WeekStatsSQL.upsert(data);
    }
  } catch (error) {
    console.error('Error in upsertInstrument52WeekStats:', error);
  }
}

async function getAllInstrument52WeekStats() {
  try {
    if (USE_MONGO) {
      console.log('getting')
      // Find all, ordered ascending by instrumentKey
      return await Instrument52WeekStatsMongo.find().sort({ instrumentKey: 1 }).exec();
    } else {
      // Sequelize findAll with order
      console.log('getting from seq')
      return await Instrument52WeekStatsSQL.findAll({
        order: [['instrument_key', 'ASC']],
      });
    }
  } catch (error) {
    console.error('Error in getAllInstrument52WeekStats:', error);
  }
}

async function upsertMarketBreadth(data) {
  try {
    if (USE_MONGO) {
      // MongoDB upsert logic
      if (Array.isArray(data)) {
        // Bulk upsert with Promise.all (iterate documents)
        return await Promise.all(data.map(async (doc) => {
          const query = { date: doc.date };
          const update = { $set: doc };
          const options = { upsert: true, new: true };
          return await MarketBreadthMongo.findOneAndUpdate(query, update, options);
        }));
      } else {
        const query = { date: data.date };
        const update = { $set: data };
        const options = { upsert: true, new: true };
        return await MarketBreadthMongo.findOneAndUpdate(query, update, options);
      }
    } else {
      // Sequelize upsert logic
      await sequelize.sync();
      if (Array.isArray(data)) {
        // Sequelize does not have batch upsert, so batch with Promise.all
        return await Promise.all(data.map(doc => MarketBreadthSQL.upsert(doc)));
      } else {
        return await MarketBreadthSQL.upsert(data);
      }
    }
  } catch (error) {
    console.error('Error in upsertMarketBreadth:', error);
  }
}

async function getAllMarketBreadth() {
  try {
    if (USE_MONGO) {
      return await MarketBreadthMongo.find().sort({ date: -1 }).exec();
    } else {
      await sequelize.sync();
      return await MarketBreadthSQL.findAll({
        order: [["date", "DESC"]],
      });
    }
  } catch (error) {
    console.error('Error in getAllMarketBreadth:', error);
  }
}

async function upsertScans(data) {
  try {
    if (USE_MONGO) {
      if (Array.isArray(data)) {
        return await Promise.all(
          data.map(async (doc) => {
            const query = { symbol: doc.symbol, date: doc.date, scanType: doc.scanType };
            const update = { $set: doc };
            const options = { upsert: true, new: true };
            return await ScansMongo.findOneAndUpdate(query, update, options);
          })
        );
      } else {
        const query = { symbol: data.symbol, date: data.date, scanType: data.scanType };
        const update = { $set: data };
        const options = { upsert: true, new: true };
        return await ScansMongo.findOneAndUpdate(query, update, options);
      }
    } else {
      await sequelize.sync();
      if (Array.isArray(data)) {
        return await Promise.all(data.map((doc) => ScansSql.upsert(doc)));
      } else {
        return await ScansSql.upsert(data);
      }
    }
  } catch (error) {
    console.error('Error in upsertScans:', error);
  }
}

const getTokenFromDB = async () => {
  try {
    if (USE_MONGO) {
      const tokenDocuments = await UpstoxsTokenMongo.findOne().sort({ issued_at: -1 }).exec();

      return tokenDocuments?.access_token
    } else {
      await sequelize.sync();
      const tokenData = await UpstoxTokenSQL.findOne({
        order: [["issuedAt", "DESC"]],
      });
      return tokenData?.accessToken;
    }
  } catch (error) {
    console.error('Error in getTokenFromDB:', error);
  }
};

const upsertTokenToDB = async (data) => {
  try {
    if (USE_MONGO) {
      const mongoData = {
        client_id: data.clientId,
        user_id: data.userId,
        access_token: data.accessToken,
        issued_at: data.issuedAt,
        expires_at: data.expiresAt,
      };
      // Upsert: find any document and update it, or create new if none exists.
      // Using empty query {} to treat it as a singleton or update the first found.
      const query = {};
      const update = { $set: mongoData };
      const options = { upsert: true, new: true };
      return await UpstoxsTokenMongo.findOneAndUpdate(query, update, options);
    } else {
      await sequelize.sync();
      const existingToken = await UpstoxTokenSQL.findOne({
        order: [["issuedAt", "DESC"]],
      });

      if (existingToken) {
        return await existingToken.update(data);
      }
      return await UpstoxTokenSQL.create(data);
    }
  } catch (error) {
    console.error('Error in upsertTokenToDB:', error);
  }
};

export default {
  upsertInstrument52WeekStats,
  getAllInstrument52WeekStats,
  upsertMarketBreadth,
  getAllMarketBreadth,
  upsertScans,
  getTokenFromDB,
  upsertTokenToDB,
};
