const mongoose = require("mongoose");
const Token = require("../models/Token");
const Counter = require("../models/Counter");
const Department = require("../models/Department");

// @desc    Create a new token
// @route   POST /api/tokens
// @access  Public
const createToken = async (req, res) => {
    try {
        console.log("[DEBUG] createToken req.body:", req.body);
        const { department, name, phone } = req.body; // department name or id, optional name/phone

        // 1. Find department to get prefix
        const dept = await Department.findOne({ 
            $or: [{ name: department }, { _id: mongoose.isValidObjectId(department) ? department : null }] 
        });

        if (!dept || dept.status !== "Active") {
            return res.status(400).json({ 
                success: false, 
                message: "Department is invalid or inactive." 
            });
        }

        const prefix = dept.prefix;

        // 2. ATOMIC: Increment Counter for this department
        const counter = await Counter.findOneAndUpdate(
            { id: `token_number_${dept.name}` },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );

        const tokenNumber = counter.seq;
        const tokenLabel = `${prefix}${tokenNumber}`;

        const token = await Token.create({
            tokenNumber,
            tokenLabel,
            patientName: name || "Walk-in",
            patientPhone: phone || "",
            department: dept.name,
            status: "waiting"
        });

        // Emit real-time event
        req.io.emit("token-created", token);
        req.io.to(dept.name).emit("queue-updated", { department: dept.name });

        res.status(201).json({
            success: true,
            message: "Token created successfully",
            data: token
        });
    } catch (error) {
        console.error("[ERROR] createToken:", error.message);
        res.status(500).json({
            success: false,
            message: error.message || "Server Error"
        });
    }
};

// @desc    Get tokens
// @route   GET /api/tokens
// @access  Public
const getTokens = async (req, res) => {
    try {
        const { department, status } = req.query;

        const query = {};
        if (department) query.department = department;
        if (status) query.status = status;

        const tokens = await Token.find(query).sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            count: tokens.length,
            data: tokens
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// @desc    Update token status
// @route   PUT /api/tokens/:id
// @access  Private
const updateTokenStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const token = await Token.findById(id);

        if (!token) {
            return res.status(404).json({ success: false, message: "Token not found" });
        }

        // STRICT STATE MACHINE: Validate transitions
        const validTransitions = {
            waiting: ["called", "skipped", "completed"],
            called: ["hold", "completed", "skipped", "called"],
            hold: ["called", "skipped"],
            // completed and skipped are terminal states
        };

        const allowed = validTransitions[token.status];
        if (!allowed || !allowed.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: `Invalid transition: ${token.status} → ${status}` 
            });
        }

        token.status = status;
        if (status === "completed") token.completedAt = Date.now();
        if (status === "hold") token.holdAt = Date.now();
        if (status === "called") token.calledAt = Date.now();

        await token.save();

        // Emit real-time event
        req.io.emit("token-updated", token);
        req.io.to(token.department).emit("queue-updated", { department: token.department });

        res.status(200).json({
            success: true,
            data: token
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Call next waiting token
// @route   POST /api/tokens/call-next
// @access  Private
const callNextToken = async (req, res) => {
    try {
        const { department } = req.body;

        const dept = await Department.findOne({ name: department });
        if (!dept) return res.status(400).json({ success: false, message: "Invalid department" });

        // Auto-complete any existing 'called' token for this department? 
        // For now, just prevent calling if one is already 'called'.
        const existingCalled = await Token.findOne({ department, status: "called" });
        if (existingCalled) {
             return res.status(200).json({
                success: true,
                message: "A token is already in called status",
                data: existingCalled
            });
        }

        const nextToken = await Token.findOneAndUpdate(
            { department, status: "waiting" },
            { 
                $set: { 
                    status: "called",
                    calledAt: new Date()
                } 
            },
            { sort: { createdAt: 1 }, new: true }
        );

        if (!nextToken) {
            return res.status(200).json({
                success: false,
                message: "No tokens waiting"
            });
        }

        // Emit real-time event
        req.io.emit("token-called", nextToken);
        req.io.to(department).emit("queue-updated", { department });

        res.status(200).json({
            success: true,
            data: nextToken
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Reset tokens
// @route   DELETE /api/tokens/reset
// @access  Private (Admin)
const resetTokens = async (req, res) => {
    try {
        const { department, confirm } = req.query;

        if (confirm !== "true") {
            return res.status(400).json({ success: false, message: "Confirm reset required" });
        }

        const query = {};
        if (department) query.department = department;

        await Token.deleteMany(query);
        
        // Reset counters too? Usually yes for a full reset.
        if (department) {
            await Counter.deleteOne({ id: `token_number_${department}` });
        } else {
            await Counter.deleteMany({ id: { $regex: /^token_number_/ } });
        }

        req.io.emit("queue-reset", { department: department || "All" });

        res.status(200).json({
            success: true,
            message: "Tokens reset successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createToken,
    getTokens,
    updateTokenStatus,
    callNextToken,
    resetTokens
};
