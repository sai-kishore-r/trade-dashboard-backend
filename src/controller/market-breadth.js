import axios from "axios";
import express from "express";
import moment from "moment";

import { sequelize } from "../database/index.js";
import niftymidsmall400 from "../index/niftymidsmall400.json" with { type: 'json' };
import { calculatePctChange5Days } from "../utils/index.js";
import dbWrapper from '../utils/dbWrapper.js'

const router = express.Router();

router.post("/sync-52week-marketbreath", async (req, res) => {
  const { fullSync } = req.query;
  const stocks = niftymidsmall400;

  if (!Array.isArray(stocks) || stocks.length === 0) {
    return res.status(400).json({ error: "Invalid or empty stocks input" });
  }

  const dateMap = new Map();

  try {
    const latestRecords = await dbWrapper.getAllMarketBreadth();
    const latestSyncedDateStr = latestRecords.length > 0 ? latestRecords[0].date : null;

    const todayStr = moment().format("YYYY-MM-DD");
    let startDate;

    if (latestSyncedDateStr && (fullSync !== true && fullSync !== 'true')) {
      const latestSyncedDate = moment(latestSyncedDateStr);
      startDate = latestSyncedDate.add(1, "days").format("YYYY-MM-DD");
      if (moment(startDate).isAfter(todayStr)) {
        return res.json({ message: "Market breadth already up-to-date." });
      }
    } else {
      startDate = moment().subtract(1, "years").format("YYYY-MM-DD");
    }

    const endDate = todayStr;
    const batchSize = 50;
    const totalBatches = Math.ceil(stocks.length / batchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batch = stocks.slice(batchIndex * batchSize, (batchIndex + 1) * batchSize);

      await Promise.all(batch.map(async (instrument) => {
        try {
          const instrumentKeyEncoded = encodeURIComponent(instrument.instrument_key);
          const url = `https://api.upstox.com/v3/historical-candle/${instrumentKeyEncoded}/days/1/${endDate}/${startDate}`;
          const headers = { Accept: "application/json" };

          const response = await axios.get(url, { headers });
          const candles = response.data?.data?.candles || [];

          if (candles.length === 0) return;

          // Assuming calculatePctChange5Days returns Map(date -> 5dPctChange)
          const pctChange5dMap = calculatePctChange5Days(candles);

          for (const candle of candles) {
            const date = candle[0].split("T")[0];
            const open = candle[1];
            const high = candle[2];
            const low = candle[3];
            const close = candle[4];
            const pctChange = ((close - open) / open) * 100;


            if (!dateMap.has(date)) {
              dateMap.set(date, {
                upCount: 0,
                downCount: 0,
                total: 0,
                up20Count: 0,
                down20Count: 0,
                up8Count5d: 0,
                down8Count5d: 0,
                strongCloseUpCount: 0,
                strongCloseDownCount: 0,
              });
            }

            const dayStats = dateMap.get(date);
            dayStats.total++;

            if (pctChange >= 4) {
              dayStats.upCount++;

              // Calculate closing strength for up moves:
              // closingStrength = (close - open) / (high - open)
              const closingStrengthUp = (high !== open) ? (close - open) / (high - open) : 0;

              if (closingStrengthUp >= 0.8) {
                dayStats.strongCloseUpCount++;
              }
            } else if (pctChange <= -4) {
              dayStats.downCount++;

              // For down moves, closing strength analogous:
              // closingStrengthDown = (close - open) / (low - open)
              // Because low < open in down moves, ratio should be ≤ 0.2 (i.e. closes near low)
              const ratio = (low !== open) ? Math.abs(close - open) / Math.abs(low - open) : 0;

              // check if ratio <= 0.2
              if (ratio >= 0.8) {
                dayStats.strongCloseDownCount++;
              }
            }

            const pctChange5d = pctChange5dMap.get(date);
            if (pctChange5d !== undefined) {
              if (pctChange5d >= 20) {
                dayStats.up20Count++;
              } else if (pctChange5d <= -20) {
                dayStats.down20Count++;
              }
              if (pctChange5d >= 8) {
                dayStats.up8Count5d++;
              } else if (pctChange5d <= -8) {
                dayStats.down8Count5d++;
              }
            }
          }
        } catch (e) {
          console.error(`Failed to process instrument ${instrument.instrument_key}:`, e.message);
        }
      }));

      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    // Prepare data with new derived columns
    const breadthDataArray = [];
    for (const [date, stats] of dateMap.entries()) {
      const strongCloseUpRatio = stats.upCount > 0 ? stats.strongCloseUpCount / stats.upCount : 0;
      const strongCloseDownRatio = stats.downCount > 0 ? stats.strongCloseDownCount / stats.downCount : 0;

      // Example composite intent scores (customize your scoring logic)
      const intentScoreUp = strongCloseUpRatio * stats.strongCloseUpCount;
      const intentScoreDown = (1 - strongCloseDownRatio) * stats.strongCloseDownCount;

      breadthDataArray.push({
        date,
        up4Percent: stats.upCount,
        down4Percent: stats.downCount,
        totalStocks: stats.total,
        up20Pct5d: stats.up20Count || 0,
        down20Pct5d: stats.down20Count || 0,
        up8Pct5d: stats.up8Count5d || 0,
        down8Pct5d: stats.down8Count5d || 0,
        strongCloseUpCount: stats.strongCloseUpCount,
        strongCloseUpRatio,
        strongCloseDownCount: stats.strongCloseDownCount,
        strongCloseDownRatio,
        intentScoreUp,
        intentScoreDown
      });
    }

    await dbWrapper.upsertMarketBreadth(breadthDataArray);

    res.json({ message: "52-week breadth synced successfully." });
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({ error: "Failed to sync 52-week breadth." });
  }
});

router.post("/sync-daily-market-breadth", async (req, res) => {
  const stocks = niftymidsmall400;

  if (!Array.isArray(stocks) || stocks.length === 0) {
    return res.status(400).json({ error: "Invalid or empty stocks input" });
  }

  const dateMap = new Map();

  try {
    await sequelize.sync();

    // Get last synced date from MarketBreadth
    const lastRecord = await dbWrapper.getAllMarketBreadth({
      order: [["date", "DESC"]],
    });

    const lastSyncedDate = lastRecord ? moment(lastRecord.date) : null;
    const todayDate = moment().format("YYYY-MM-DD");

    // Start date is next day after last synced date or fallback to 10 days ago
    let startDate;
    if (lastSyncedDate && lastSyncedDate.isValid()) {
      startDate = lastSyncedDate.add(1, "days").format("YYYY-MM-DD");
    } else {
      startDate = moment().subtract(10, "days").format("YYYY-MM-DD");
    }

    // If startDate is after today, nothing to sync
    if (moment(startDate).isAfter(todayDate)) {
      return res.json({ message: "Market breadth already up-to-date." });
    }

    const batchSize = 50;
    const totalBatches = Math.ceil(stocks.length / batchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batch = stocks.slice(batchIndex * batchSize, (batchIndex + 1) * batchSize);

      await Promise.all(batch.map(async (instrument) => {
        try {
          const instrumentKeyEncoded = encodeURIComponent(instrument.instrument_key);
          const url = `https://api.upstox.com/v3/historical-candle/${instrumentKeyEncoded}/days/1/${todayDate}/${startDate}`;
          const headers = { Accept: "application/json" };

          const response = await axios.get(url, { headers });
          const candles = response.data?.data?.candles || [];

          if (candles.length === 0) { return; }

          const pctChange5dMap = calculatePctChange5Days(candles.slice(0, 5));

          // Process each candle
          for (const candle of candles) {
            const date = candle[0].split("T")[0];
            const open = candle[1];
            const close = candle[4];
            const pctChange = ((close - open) / open) * 100;

            if (!dateMap.has(date)) {
              dateMap.set(date, {
                upCount: 0,
                downCount: 0,
                total: 0,
                up20Count: 0,
                down20Count: 0,
              });
            }

            const dayStats = dateMap.get(date);
            dayStats.total++;

            if (pctChange >= 4) { dayStats.upCount++; }
            else if (pctChange <= -4) { dayStats.downCount++; }

            const pctChange5d = pctChange5dMap.get(date);
            if (pctChange5d !== undefined) {
              if (pctChange5d >= 20) { dayStats.up20Count++; }
              else if (pctChange5d <= -20) { dayStats.down20Count++; }
            }
          }
        } catch (e) {
          console.error(`Failed to process instrument ${instrument.instrument_key}:`, e.message);
        }
      }));

      // Optional delay to avoid API limits
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Upsert aggregated stats
    for (const [date, stats] of dateMap.entries()) {
      await dbWrapper.upsertMarketBreadth({
        date,
        up4Percent: stats.upCount,
        down4Percent: stats.downCount,
        totalStocks: stats.total,
        up20Pct5d: stats.up20Count || 0,
        down20Pct5d: stats.down20Count || 0,
      });
    }

    res.json({ message: "Daily market breadth synced successfully." });
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({ error: "Failed to sync daily market breadth." });
  }
});

router.get("/market-breadth", async (req, res) => {
  try {
    const breadthData = await dbWrapper.getAllMarketBreadth({
      order: [["date", "DESC"]]
    });

    res.json({
      status: "success",
      data: breadthData
    });
  } catch (error) {
    console.error("Failed to fetch market breadth:", error);
    res.status(500).json({ error: "Failed to retrieve market breadth data" });
  }
});

export default router;