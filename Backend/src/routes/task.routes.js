const { Router } = require("express");
const {
    reportTask,
    listTasks,
    getTask,
    assignTask,
    updateTaskStatus,
    reviewTaskResolution,
} = require("../controllers/task.controller.js");
const { verifyJWT, authorizeRoles } = require("../middlewares/auth.middleware.js");

const router = Router();

// Public task endpoints
router.post("/", verifyJWT, reportTask);
router.get("/", verifyJWT, listTasks);
router.get("/:taskId", verifyJWT, getTask);

// Technician & Manager - update task status
router.put("/:taskId", verifyJWT, updateTaskStatus);

// Manager only
router.patch("/:taskId/assign", verifyJWT, authorizeRoles("manager"), assignTask);
router.patch("/:taskId/review", verifyJWT, authorizeRoles("manager"), reviewTaskResolution);

module.exports = router;