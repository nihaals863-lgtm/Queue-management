const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Department name is required"],
        unique: true,
        trim: true
    },
    prefix: {
        type: String,
        required: [true, "Department prefix is required"],
        unique: true,
        uppercase: true,
        trim: true
    },
    status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active"
    }
}, { timestamps: true });

module.exports = mongoose.model("Department", departmentSchema);
