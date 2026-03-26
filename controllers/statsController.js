const Token = require("../models/Token");

// @desc    Get queue statistics
// @route   GET /api/stats
// @access  Public
const getStats = async (req, res) => {
    try {
        console.log("[DEBUG] Calculating dashboard stats using aggregation");

        const stats = await Token.aggregate([
            {
                $group: {
                    _id: null,
                    totalTokens: { $sum: 1 },
                    waitingCount: { $sum: { $cond: [{ $eq: ["$status", "waiting"] }, 1, 0] } },
                    calledCount: { $sum: { $cond: [{ $eq: ["$status", "called"] }, 1, 0] } },
                    completedCount: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                    holdCount: { $sum: { $cond: [{ $eq: ["$status", "hold"] }, 1, 0] } },
                    avgWaitTimeMs: {
                        $avg: {
                            $cond: [
                                { $ifNull: ["$calledAt", false] },
                                { $subtract: ["$calledAt", "$createdAt"] },
                                null // Ignore nulls in average
                            ]
                        }
                    },
                    avgServiceTimeMs: {
                        $avg: {
                            $cond: [
                                { $ifNull: ["$completedAt", false] },
                                { $subtract: ["$completedAt", "$calledAt"] },
                                null
                            ]
                        }
                    }
                }
            }
        ]);

        // Default stats if no tokens exist
        const defaultStats = {
            totalTokens: 0,
            waitingCount: 0,
            calledCount: 0,
            completedCount: 0,
            holdCount: 0,
            avgWaitTimeSec: 0,
            avgServiceTimeSec: 0
        };

        if (stats.length === 0) {
            return res.status(200).json({
                success: true,
                data: defaultStats
            });
        }

        const result = stats[0];

        // Format times to seconds (2 decimal places)
        const formatSec = (ms) => (ms ? Number((ms / 1000).toFixed(2)) : 0);

        res.status(200).json({
            success: true,
            data: {
                totalTokens: result.totalTokens,
                waitingCount: result.waitingCount,
                calledCount: result.calledCount,
                completedCount: result.completedCount,
                holdCount: result.holdCount,
                avgWaitTimeSec: formatSec(result.avgWaitTimeMs),
                avgServiceTimeSec: formatSec(result.avgServiceTimeMs)
            }
        });

    } catch (error) {
        console.error("[ERROR] getStats:", error.message);
        res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
};

module.exports = {
    getStats
};
