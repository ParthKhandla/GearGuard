import { Router } from "express";
import {
    createUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    refreshAccessToken,
    deleteUser,
    changePassword
} from "../controllers/user.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

// ── Public ────────────────────────────────────────────────────
router.post("/login",         loginUser);
router.post("/refresh-token", refreshAccessToken);

// ── Private (any logged-in user) ──────────────────────────────
router.post("/logout", verifyJWT, logoutUser);
router.get ("/me",     verifyJWT, getCurrentUser);
router.post("/change-password", verifyJWT, changePassword);

// ── Manager only ──────────────────────────────────────────────
router.post("/manager/create-user", verifyJWT, authorizeRoles("manager"), createUser);

router.delete("/manager/delete-user/:id", verifyJWT, authorizeRoles("manager"), deleteUser);

export default router;