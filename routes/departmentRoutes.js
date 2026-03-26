const express = require("express");
const router = express.Router();
const { 
    getDepartments, 
    createDepartment, 
    updateDepartmentStatus, 
    deleteDepartment 
} = require("../controllers/departmentController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", getDepartments);
router.post("/", protect, authorize("admin"), createDepartment);
router.patch("/:id", protect, authorize("admin"), updateDepartmentStatus);
router.delete("/:id", protect, authorize("admin"), deleteDepartment);

module.exports = router;
