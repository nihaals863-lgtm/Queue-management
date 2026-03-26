const express = require("express");
const router = express.Router();
const { getStats } = require("../controllers/statsController");

const { protect, authorize } = require("../middleware/authMiddleware");

// @route   GET /api/stats
// @desc    Get dashboard statistics
router.get("/", protect, authorize('operator', 'admin'), getStats);


module.exports = router;
