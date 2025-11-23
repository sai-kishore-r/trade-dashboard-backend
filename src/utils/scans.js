import dbWrapper from "./dbWrapper.js";

const genProcessNewHighScan = () => {
    //TODO: move this config file
    const MARKET_OPEN_HOUR = 9;
    const MARKET_OPEN_MINUTE = 15;
    const TRACKING_DURATION_MINUTES = 30;
    const scanStates = {
        newHigh: {
            prevHighs: {},
            newHighCounts: {},
        },
    };

    const isWithinFirst30Mins = (timestamp) => {
        const tsDate = new Date(Number(timestamp)); // Local time automatically

        // Market open for that day IN LOCAL TIME
        const marketOpen = new Date(
            tsDate.getFullYear(),
            tsDate.getMonth(),
            tsDate.getDate(),
            MARKET_OPEN_HOUR,
            MARKET_OPEN_MINUTE,
            0,
            0
        );

        const diffMinutes = (tsDate - marketOpen) / (1000 * 60);

        return diffMinutes >= 0 && diffMinutes <= TRACKING_DURATION_MINUTES;
    };


    return async (symbol, ohlc, currentTs) => {
        const { prevHighs, newHighCounts } = scanStates.newHigh;
        const currentHigh = ohlc.high;

        if (!isWithinFirst30Mins(currentTs)) {
            //TODO: Terminate the socket connect and intiate via cron or on demand api way.
            return;
        }

        try {
            if (!(symbol in prevHighs)) {
                prevHighs[symbol] = currentHigh;
                newHighCounts[symbol] = 0;

                return;
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
    }
};

let statsCache = null;
let isFetching = false;

const get52WeekStatsMap = async () => {
    if (statsCache) return statsCache;
    if (isFetching) return null;
    isFetching = true;
    try {
        const stats = await dbWrapper.getAllInstrument52WeekStats();
        statsCache = {};
        stats.forEach(doc => {
            const key = doc.instrumentKey;
            const lastPrice = doc.lastPrice;
            if (key && lastPrice) {
                statsCache[key] = Number(lastPrice.toString());
            }
        });
    } catch (err) {
        console.error("Failed to fetch 52w stats", err);
    } finally {
        isFetching = false;
    }
    return statsCache;
};

const genProcess4PercentBOScan = () => {
    const processedSymbols = new Set();

    return async (symbol, ohlc, currentTs) => {
        if (processedSymbols.has(symbol)) return;

        const stats = await get52WeekStatsMap();
        if (!stats) return;

        const prevClose = stats[symbol];
        if (!prevClose) return;

        const currentPrice = ohlc.close;
        const pctChange = ((currentPrice - prevClose) / prevClose) * 100;

        if (Math.abs(pctChange) >= 4) {
            processedSymbols.add(symbol);
            await dbWrapper.upsertScans({
                symbol,
                scanType: pctChange >= 4 ? "4PercentBO" : "4PercentBD",
                date: new Date().toISOString().slice(0, 10),
                extraData: {
                    prevClose,
                    currentPrice,
                    pctChange,
                    currentTs,
                    isBO: pctChange >= 4,
                }
            });
        }
    };
};

const processNewHighScan = genProcessNewHighScan();
const process4PercentBOScan = genProcess4PercentBOScan();

export {
    processNewHighScan,
    process4PercentBOScan,
};