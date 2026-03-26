const Department = require("../models/Department");

// @desc    Get all departments
// @route   GET /api/departments
// @access  Public
exports.getDepartments = async (req, res) => {
    try {
        const departments = await Department.find();
        res.status(200).json({
            success: true,
            count: departments.length,
            data: departments
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a department
// @route   POST /api/departments
// @access  Private (Admin)
exports.createDepartment = async (req, res) => {
    try {
        const { name, prefix } = req.body;

        const department = await Department.create({ name, prefix });

        res.status(201).json({
            success: true,
            data: department
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Department or Prefix already exists" });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update department status
// @route   PATCH /api/departments/:id
// @access  Private (Admin)
exports.updateDepartmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["Active", "Inactive"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const department = await Department.findByIdAndUpdate(id, { status }, { new: true });

        if (!department) {
            return res.status(404).json({ success: false, message: "Department not found" });
        }

        res.status(200).json({
            success: true,
            data: department
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (Admin)
exports.deleteDepartment = async (req, res) => {
    try {
        const department = await Department.findByIdAndDelete(req.params.id);

        if (!department) {
            return res.status(404).json({ success: false, message: "Department not found" });
        }

        res.status(200).json({
            success: true,
            message: "Department deleted"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
