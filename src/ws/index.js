import dotenv from 'dotenv';
import UpstoxClient from "upstox-js-sdk";
import niftymidsmall400float from '../index/niftymidsmall400.json' with { type: "json" };
import niftylargeCap from '../index/niftylargecap.json' with { type: "json" };
import { processNewHighScan } from "../utils/scans.js";
import { intiateAccessTokenReq } from './utils.js';

dotenv.config();

const scripts = niftymidsmall400float;
const instruments = scripts.map((script) => script.instrument_key);
const niftylargeCaps = niftylargeCap.map((script) => script.instrument_key);
const stockUniverse = [...instruments, ...niftylargeCaps];

export const connectWsUpstoxs = (token) => {
  let defaultClient = UpstoxClient.ApiClient.instance;
  const OAUTH2 = defaultClient.authentications["OAUTH2"];
  OAUTH2.accessToken = token || process.env.VITE_UPSTOXS_ACCESS_KEY;

  const streamer = new UpstoxClient.MarketDataStreamerV3(stockUniverse, "full");

  streamer.autoReconnect(false);
  streamer.connect();

  streamer.on("message", async (data) => {
    try {
      const parsed = JSON.parse(data.toString("utf-8"));
      if (parsed.type !== "live_feed" || !parsed.feeds) return;

      for (const symbol in parsed.feeds) {
        const feed = parsed.feeds[symbol];
        if (!feed?.fullFeed?.marketFF?.marketOHLC) continue;

        const ohlcDay = feed.fullFeed.marketFF.marketOHLC.ohlc.find(x => x.interval === "1d");
        if (!ohlcDay) continue;

        processNewHighScan(symbol, ohlcDay);
      }
    } catch (err) {
      console.error("Error processing stream data:", err);
    }
  });

  streamer.on('error', (err) => {
    console.error('Upstox MarketDataStreamerV3 error:', err.message);
    if (err.message === "Unexpected server response: 401") {
      if(process.env.LOWER_ENV !== 'true')
        intiateAccessTokenReq();
    }
  });
};

