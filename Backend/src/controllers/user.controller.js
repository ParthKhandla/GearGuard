import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../db/index.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { sendWelcomeEmail } from "../utils/sendEmail.js";

const cookieOptions = {
    httpOnly: true,
    secure: true,
};

// ── Utility functions ──────────────────────────────────────────
const isPasswordCorrect = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

const generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            username: user.username,
            fullName: user.fullName,
            role: user.role,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user.id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
};

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new ApiError(404, "User not found");

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await prisma.user.update({
            where: { id: userId },
            data: { refreshToken }
        });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
};


// ─────────────────────────────────────────────
//  1. MANAGER CREATES EMPLOYEE OR TECHNICIAN
//     Route:  POST /api/users/manager/create-user
//     Access: Private — only logged-in manager
//     Body:   { fullName, email, username, password, role, department?, employeeId? }
// ─────────────────────────────────────────────
const createUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password, role, department, employeeId } = req.body

    if ([fullName, email, username, password, role].some((f) => !f || f.trim() === "")) {
        throw new ApiError(400, "fullName, email, username, password and role are required")
    }

    if (role === "manager") {
        throw new ApiError(403, "A manager cannot create another manager account")
    }

    if (!["employee", "technician"].includes(role)) {
        throw new ApiError(400, "Role must be either 'employee' or 'technician'")
    }

    const existingUser = await prisma.user.findFirst({
        where: { OR: [{ username }, { email }] }
    })
    if (existingUser) {
        throw new ApiError(409, "User with this email or username already exists")
    }

    if (employeeId) {
        const existingId = await prisma.user.findUnique({ where: { employeeId } })
        if (existingId) {
            throw new ApiError(409, "This Employee ID is already assigned to another user")
        }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
        data: {
            fullName,
            email,
            password: hashedPassword,
            username: username.toLowerCase(),
            role,
            department: department || null,
            employeeId: employeeId || null,
        },
        select: {
            id: true, username: true, email: true,
            fullName: true, role: true, department: true,
            employeeId: true, isActive: true,
            createdAt: true, updatedAt: true
        }
    })

    // ✅ send welcome email with credentials
    await sendWelcomeEmail({
        fullName,
        email,
        username,
        password,      // plain password before hashing
        role,
        department,
        employeeId
    })

    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1)

    return res.status(201).json(
        new ApiResponse(201, user, `${roleLabel} account created successfully. Login details sent to ${email}`)
    )
})


// ─────────────────────────────────────────────
//  2. LOGIN — same route for all roles
//     Route:  POST /api/users/login
//     Access: Public
//     Body:   { email OR username, password }
// ─────────────────────────────────────────────
const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!email && !username) {
        throw new ApiError(400, "Email or username is required");
    }

    const user = await prisma.user.findFirst({
        where: { OR: [{ username }, { email }] }
    });
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    if (!user.isActive) {
        throw new ApiError(403, "Your account has been deactivated. Contact your manager.");
    }

    const isPasswordValid = await isPasswordCorrect(password, user.password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user.id);

    const loggedInUser = {
        id: user.id, username: user.username, email: user.email,
        fullName: user.fullName, role: user.role, department: user.department,
        employeeId: user.employeeId, isActive: user.isActive,
        createdAt: user.createdAt, updatedAt: user.updatedAt
    };

    return res
        .status(200)
        .cookie("accessToken",  accessToken,  cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "Logged in successfully"));
});

// ─────────────────────────────────────────────
//  CHANGE PASSWORD
//  Route:  POST /api/v1/users/change-password
//  Access: Private (any logged-in user)
//  Body:   { oldPassword, newPassword }
// ─────────────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old password and new password are required")
    }

    if (oldPassword === newPassword) {
        throw new ApiError(400, "New password cannot be same as old password")
    }

    if (newPassword.length < 6) {
        throw new ApiError(400, "New password must be at least 6 characters")
    }

    // get user with password from DB
    const user = await prisma.user.findUnique({
        where: { id: req.user.id }
    })

    // verify old password is correct
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password)
    if (!isOldPasswordValid) {
        throw new ApiError(401, "Old password is incorrect")
    }

    // hash new password and save
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
        where: { id: req.user.id },
        data: { password: hashedPassword }
    })

    return res.status(200).json(
        new ApiResponse(200, {}, "Password changed successfully")
    )
})


// ─────────────────────────────────────────────
//  3. LOGOUT
//     Route:  POST /api/users/logout
//     Access: Private (any logged-in user)
// ─────────────────────────────────────────────
const logoutUser = asyncHandler(async (req, res) => {
    await prisma.user.update({
        where: { id: req.user.id },
        data: { refreshToken: null }
    });

    return res
        .status(200)
        .clearCookie("accessToken",  cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "Logged out successfully"));
});

const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params  // ← id of user to delete from URL

    // check if user exists
    const user = await prisma.user.findUnique({
        where: { id: parseInt(id) }
    })
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    // prevent manager from deleting themselves
    if (user.id === req.user.id) {
        throw new ApiError(400, "You cannot delete your own account")
    }

    // prevent deleting another manager
    if (user.role === "manager") {
        throw new ApiError(403, "You cannot delete a manager account")
    }

    await prisma.user.delete({
        where: { id: parseInt(id) }
    })

    return res.status(200).json(
        new ApiResponse(200, {}, "User deleted successfully")
    )
})


// ─────────────────────────────────────────────
//  4. GET CURRENT USER
//     Route:  GET /api/users/me
//     Access: Private (any logged-in user)
// ─────────────────────────────────────────────
const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, req.user, "Current user fetched successfully")
    );
});


// ─────────────────────────────────────────────
//  5. REFRESH ACCESS TOKEN
//     Route:  POST /api/users/refresh-token
//     Access: Public
// ─────────────────────────────────────────────
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is required");
    }

    const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user || incomingRefreshToken !== user.refreshToken) {
        throw new ApiError(401, "Invalid or expired refresh token");
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user.id);

    return res
        .status(200)
        .cookie("accessToken",  accessToken,     cookieOptions)
        .cookie("refreshToken", newRefreshToken, cookieOptions)
        .json(new ApiResponse(200, { accessToken }, "Access token refreshed"));
});


export {
    createUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    refreshAccessToken,
    deleteUser,
    changePassword
};