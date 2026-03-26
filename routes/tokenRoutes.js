const express = require("express");
const router = express.Router();
const {
    createToken,
    getTokens,
    updateTokenStatus,
    callNextToken,
    resetTokens
} = require("../controllers/tokenController");

const { protect, authorize } = require("../middleware/authMiddleware");

// @route   DELETE /api/tokens/reset
// @desc    Reset tokens
router.delete("/reset", protect, authorize('admin'), resetTokens);

// @route   POST /api/tokens/call-next
// @desc    Call next waiting token
router.post("/call-next", protect, authorize('operator', 'admin'), callNextToken);


// @route   POST /api/tokens
// @desc    Create a new token
router.post("/", createToken);


// @route   GET /api/tokens
// @desc    Get all tokens
router.get("/", getTokens);

// @route   PUT /api/tokens/:id
// @desc    Update token status
router.put("/:id", protect, authorize('operator', 'admin'), updateTokenStatus);


module.exports = router;
