import express from "express";
import ScanCriteria from "../schema/RDB/scanCriteria.js";
import verifyToken from "../middleware/authMiddleware.js";

const scanCriteriaController = express.Router();

// Get all active scan criteria
scanCriteriaController.get("/criteria", verifyToken, async (req, res) => {
    try {
        const criteria = await ScanCriteria.find({ isActive: true });
        res.status(200).json({ success: true, data: criteria });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create new scan criteria
scanCriteriaController.post("/criteria", verifyToken, async (req, res) => {
    try {
        const { name, description, criteria, isActive } = req.body;
        const newCriteria = new ScanCriteria({
            name,
            description,
            criteria,
            isActive: isActive !== undefined ? isActive : true,
        });
        await newCriteria.save();
        res.status(201).json({ success: true, data: newCriteria });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update scan criteria
scanCriteriaController.put("/criteria/:id", verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const updatedCriteria = await ScanCriteria.findByIdAndUpdate(id, updates, { new: true });
        if (!updatedCriteria) {
            return res.status(404).json({ success: false, error: "Criteria not found" });
        }
        res.status(200).json({ success: true, data: updatedCriteria });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete scan criteria
scanCriteriaController.delete("/criteria/:id", verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCriteria = await ScanCriteria.findByIdAndDelete(id);
        if (!deletedCriteria) {
            return res.status(404).json({ success: false, error: "Criteria not found" });
        }
        res.status(200).json({ success: true, message: "Criteria deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default scanCriteriaController;
