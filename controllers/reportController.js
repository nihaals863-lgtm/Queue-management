const Token = require("../models/Token");
const Department = require("../models/Department");
const ExcelJS = require("exceljs");

// @desc    Get reports data
// @route   GET /api/reports
// @access  Private (Admin)
exports.getReports = async (req, res) => {
    try {
        const { startDate, endDate, department } = req.query;

        const query = {};

        // Date filtering
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // Department filtering
        if (department && department !== "All") {
            query.department = department;
        }

        const tokens = await Token.find(query);

        // Calculate stats
        const total = tokens.length;
        const completed = tokens.filter(t => t.status === "completed").length;
        const skipped = tokens.filter(t => t.status === "skipped").length;
        
        // Avg Wait Time
        const calledTokens = tokens.filter(t => t.calledAt);
        const totalWaitTime = calledTokens.reduce((acc, t) => {
            return acc + (new Date(t.calledAt) - new Date(t.createdAt));
        }, 0);
        const avgWaitTimeSec = calledTokens.length > 0 
            ? Number(((totalWaitTime / calledTokens.length) / 1000).toFixed(2)) 
            : 0;

        res.status(200).json({
            success: true,
            data: {
                total,
                completed,
                skipped,
                avgWaitTimeSec,
                tokens: tokens.slice(-100) // Return last 100 for the table
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Export reports to Excel
// @route   GET /api/reports/export
// @access  Private (Admin)
exports.exportReport = async (req, res) => {
    try {
        const tokens = await Token.find({}).sort({ createdAt: 1 });
        const departments = await Department.find({});

        const workbook = new ExcelJS.Workbook();
        workbook.creator = "GTH Queue System";
        workbook.lastModifiedBy = "Admin";
        workbook.created = new Date();

        // --- SHEET 1: SUMMARY ---
        const summarySheet = workbook.addWorksheet("Summary");
        summarySheet.columns = [
            { header: "Metric", key: "metric", width: 25 },
            { header: "Value", key: "value", width: 15 }
        ];

        const totalProcessed = tokens.filter(t => ["completed", "skipped"].includes(t.status)).length;
        const waitingCount = tokens.filter(t => t.status === "waiting").length;
        
        // Stats Calculation
        const completedTokens = tokens.filter(t => t.status === "completed");
        const calledTokens = tokens.filter(t => t.calledAt);
        
        const totalWaitTime = calledTokens.reduce((acc, t) => acc + (new Date(t.calledAt) - new Date(t.createdAt)), 0);
        const avgWaitSec = calledTokens.length > 0 ? (totalWaitTime / calledTokens.length / 1000).toFixed(2) : 0;

        const totalServiceTime = completedTokens.filter(t => t.calledAt && t.completedAt).reduce((acc, t) => acc + (new Date(t.completedAt) - new Date(t.calledAt)), 0);
        const avgServiceSec = completedTokens.filter(t => t.calledAt && t.completedAt).length > 0 
            ? (totalServiceTime / completedTokens.filter(t => t.calledAt && t.completedAt).length / 1000).toFixed(2) 
            : 0;

        summarySheet.addRows([
            { metric: "Total Tokens Generated", value: tokens.length },
            { metric: "Total Processed", value: totalProcessed },
            { metric: "Current Waiting Pool", value: waitingCount },
            { metric: "Average Wait Time (s)", value: avgWaitSec },
            { metric: "Average Service Time (s)", value: avgServiceSec }
        ]);

        summarySheet.getRow(1).font = { bold: true };

        // --- SHEET 2: DETAILED TOKENS ---
        const detailSheet = workbook.addWorksheet("Detailed Tokens");
        detailSheet.columns = [
            { header: "Token Label", key: "tokenLabel", width: 15 },
            { header: "Patient Name", key: "patientName", width: 25 },
            { header: "Phone", key: "patientPhone", width: 15 },
            { header: "Department", key: "department", width: 15 },
            { header: "Status", key: "status", width: 12 },
            { header: "Created At", key: "createdAt", width: 25 },
            { header: "Called At", key: "calledAt", width: 25 },
            { header: "Completed At", key: "completedAt", width: 25 }
        ];

        tokens.forEach(t => {
            detailSheet.addRow({
                tokenLabel: t.tokenLabel,
                patientName: t.patientName || "Walk-in",
                patientPhone: t.patientPhone || "N/A",
                department: t.department,
                status: t.status.toUpperCase(),
                createdAt: t.createdAt ? new Date(t.createdAt).toLocaleString() : "N/A",
                calledAt: t.calledAt ? new Date(t.calledAt).toLocaleString() : "N/A",
                completedAt: t.completedAt ? new Date(t.completedAt).toLocaleString() : "N/A"
            });
        });

        detailSheet.getRow(1).font = { bold: true };

        // --- SHEET 3: DEPARTMENT STATS ---
        const deptSheet = workbook.addWorksheet("Department Stats");
        deptSheet.columns = [
            { header: "Department Name", key: "name", width: 25 },
            { header: "Total Tokens", key: "total", width: 15 },
            { header: "Completed", key: "completed", width: 12 },
            { header: "Skipped", key: "skipped", width: 12 }
        ];

        departments.forEach(d => {
            const deptTokens = tokens.filter(t => t.department === d.name);
            deptSheet.addRow({
                name: d.name,
                total: deptTokens.length,
                completed: deptTokens.filter(t => t.status === "completed").length,
                skipped: deptTokens.filter(t => t.status === "skipped").length
            });
        });

        deptSheet.getRow(1).font = { bold: true };

        // --- SEND RESPONSE ---
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=" + `GTH_Queue_Report_${new Date().toISOString().split('T')[0]}.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Export Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
