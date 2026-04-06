import { Router } from "express";
import {
    createUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    refreshAccessToken,
    deleteUser,
    changePassword,
    listTechnicians,
    listAvailableTechnicians,
    listAvailableGeneralTechnicians,
    listAllUsers,
    sendOtp,
    verifyOtp,
    resetPassword
} from "../controllers/user.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

// ── Public ────────────────────────────────────────────────────
router.post("/login",         loginUser);
router.post("/refresh-token", refreshAccessToken);
router.post("/send-otp",      sendOtp);
router.post("/verify-otp",    verifyOtp);
router.post("/reset-password", resetPassword);

// ── Private (any logged-in user) ──────────────────────────────
router.post("/logout", verifyJWT, logoutUser);
router.get ("/me",     verifyJWT, getCurrentUser);
router.post("/change-password", verifyJWT, changePassword);

// ── Manager only ──────────────────────────────────────────────
router.get("/manager/all-users", verifyJWT, authorizeRoles("manager"), listAllUsers);
router.post("/manager/create-user", verifyJWT, authorizeRoles("manager"), createUser);
router.delete("/manager/delete-user", verifyJWT, authorizeRoles("manager"), deleteUser);
router.get("/manager/technicians", verifyJWT, authorizeRoles("manager"), listTechnicians);
router.get("/manager/technicians/available", verifyJWT, authorizeRoles("manager"), listAvailableTechnicians);
router.get("/manager/technicians/available-general", verifyJWT, authorizeRoles("manager"), listAvailableGeneralTechnicians);

export default router;