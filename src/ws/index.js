import UpstoxClient from "upstox-js-sdk";
import dbWrapper from '../utils/dbWrapper.js';
import niftymidsmall400float from '../index/niftymidsmall400.json' with { type: "json" };
import niftylargeCap from '../index/niftylargecap.json' with { type: "json" };

const scripts = niftymidsmall400float;
const instruments = scripts.map((script) => script.instrument_key);
const niftylargeCaps = niftylargeCap.map((script) => script.instrument_key);
const stockUniverse = [...instruments, ...niftylargeCaps];

let defaultClient = UpstoxClient.ApiClient.instance;
const OAUTH2 = defaultClient.authentications["OAUTH2"];
OAUTH2.accessToken = process.env.VITE_UPSTOXS_ACCESS_KEY;

const MARKET_OPEN_HOUR = 9;
const MARKET_OPEN_MINUTE = 15;
const TRACKING_DURATION_MINUTES = 30;

const isWithinFirst30Mins = (timestamp) => {
  const tsDate = new Date(Number(timestamp));
  
  // Build market open time for that same date
  const marketOpen = new Date(tsDate);
  marketOpen.setHours(MARKET_OPEN_HOUR, MARKET_OPEN_MINUTE, 0, 0);

  const diffMinutes = (tsDate - marketOpen) / (1000 * 60);
  return diffMinutes >= 0 && diffMinutes <= TRACKING_DURATION_MINUTES;
};

// Scan states
const scanStates = {
  newHigh: {
    prevHighs: {},
    newHighCounts: {},
  },
  // Additional scan states can go here
};

// Scan processor functions
const processNewHighScan = async (symbol, ohlc) => {
  const { prevHighs, newHighCounts } = scanStates.newHigh;
  const currentHigh = ohlc.high;

  if (!isWithinFirst30Mins(ohlc.ts)) {
    // Optional: log or skip silently
    return;
  }

  try {
    if (!(symbol in prevHighs)) {
      prevHighs[symbol] = currentHigh;
      newHighCounts[symbol] = 0;
      return; // no scan result this time
    }

    if (currentHigh > prevHighs[symbol]) {
      prevHighs[symbol] = currentHigh;
      newHighCounts[symbol] += 1;

      await dbWrapper.upsertScans({
        symbol,
        scanType: "newHigh",
        date: new Date().toISOString().slice(0, 10),
        extraData: {
          open: ohlc.open,
          close: ohlc.close,
          low: ohlc.low,
          previousHigh: prevHighs[symbol],
          newHigh: currentHigh,
          newHighCount: newHighCounts[symbol],
        },
      });
    }
  } catch (error) {
    console.error(`Error processing new high scan for ${symbol}:`, error);
  }
};


// Additional scan functions can be declared similarly

export const connectWsUpstoxs = () => {
  try {
    const streamer = new UpstoxClient.MarketDataStreamerV3(stockUniverse, "full");
    streamer.connect();

    streamer.on("message", async (data) => {
      try {
        const parsed = JSON.parse(data.toString("utf-8"));
        if (parsed.type !== "live_feed" || !parsed.feeds) return;

        const upsertPayloads = [];

        for (const symbol in parsed.feeds) {
          const feed = parsed.feeds[symbol];
          if (!feed?.fullFeed?.marketFF?.marketOHLC) continue;

          const ohlcDay = feed.fullFeed.marketFF.marketOHLC.ohlc.find(x => x.interval === "1d");
          if (!ohlcDay) continue;

          // Call scan functions imperatively
          processNewHighScan(symbol, ohlcDay);


          // Call extra scans similarly:
          // const volumeSpikeResult = processVolumeSpikeScan(symbol, ohlcDay);
          // if (volumeSpikeResult) { upsertPayloads.push(volumeSpikeResult); }
        }
      } catch (err) {
        console.error("Error processing stream data:", err);
      }
    });
  }
  catch { }
};
