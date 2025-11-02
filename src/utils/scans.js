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
        const tsDate = new Date(Number(timestamp));

        const marketOpen = new Date(tsDate);
        marketOpen.setHours(MARKET_OPEN_HOUR, MARKET_OPEN_MINUTE, 0, 0);

        const diffMinutes = (tsDate - marketOpen) / (1000 * 60);
        return diffMinutes >= 0 && diffMinutes <= TRACKING_DURATION_MINUTES;
    };


    return async (symbol, ohlc) => {
        const { prevHighs, newHighCounts } = scanStates.newHigh;
        const currentHigh = ohlc.high;

        if (!isWithinFirst30Mins(ohlc.ts)) {
            //TODO: Terminate the socket connect and intiate via cron or on demand api way.
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
    }
};

const processNewHighScan = genProcessNewHighScan();

export {
    processNewHighScan,
};