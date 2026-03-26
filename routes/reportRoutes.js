const express = require("express");
const router = express.Router();
const { getReports, exportReport } = require("../controllers/reportController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", protect, authorize("admin"), getReports);
router.get("/export", protect, authorize("admin"), exportReport);

module.exports = router;
