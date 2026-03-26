const express = require("express");
const router = express.Router();
const { 
    getUsers, 
    createUser, 
    deleteUser 
} = require("../controllers/userController");

const { protect, authorize } = require("../middleware/authMiddleware");

// All routes are admin only
router.use(protect);
router.use(authorize("admin"));

router.get("/", getUsers);
router.post("/", createUser);
router.delete("/:id", deleteUser);

module.exports = router;
