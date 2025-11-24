import express from "express";
import dbWrapper from "../utils/dbWrapper.js";
import moment from "moment";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const { scanType, date } = req.query;

        // Default to today if date is not provided
        const queryDate = date || moment().format("YYYY-MM-DD");

        const scans = await dbWrapper.getScans(scanType, queryDate);

        res.json({
            status: "success",
            data: scans,
            meta: {
                date: queryDate,
                scanType: scanType || "all",
                count: scans.length
            }
        });
    } catch (error) {
        console.error("Error fetching scans:", error);
        res.status(500).json({ error: "Failed to fetch scans" });
    }
});

export default router;
