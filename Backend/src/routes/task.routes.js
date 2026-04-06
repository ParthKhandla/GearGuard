import { Router } from "express";
import {
    reportTask,
    listTasks,
    getTask,
    assignTask,
    updateTaskStatus,
    reviewTaskResolution,
} from "../controllers/task.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

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

export default router;