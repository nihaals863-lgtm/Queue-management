const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
    tokenNumber: {
        type: Number,
        required: [true, "Token number is required"]
    },
    tokenLabel: {
        type: String,
        required: [true, "Token label is required"]
    },
    patientName: {
        type: String,
        default: ""
    },
    patientPhone: {
        type: String,
        default: ""
    },

    department: {
        type: String,
        required: [true, "Department is required"],
        enum: {
            values: ["Reception", "Triage", "Consultation"],
            message: "Department must be Reception, Triage, or Consultation"
        }
    },
    status: {
        type: String,
        required: [true, "Status is required"],
        enum: {
            values: ["waiting", "called", "completed", "skipped", "hold"],
            message: "Status must be waiting, called, completed, skipped, or hold"
        },
        default: "waiting"
    },
    calledAt: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    holdAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }


});

// Performance Index for Queue Queries
tokenSchema.index({ department: 1, status: 1, createdAt: 1 });

module.exports = mongoose.model("Token", tokenSchema);

