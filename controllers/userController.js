const User = require("../models/User");

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().populate("department", "name");
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a user
// @route   POST /api/users
// @access  Private (Admin)
exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role, department } = req.body;

        const user = await User.create({
            name,
            email,
            password,
            role,
            department: department || null
        });

        res.status(201).json({
            success: true,
            data: user
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            message: "User deleted"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
