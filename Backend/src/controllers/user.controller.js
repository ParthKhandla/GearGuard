import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../db/index.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { DEPARTMENTS } from "../constants.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { sendWelcomeEmail, sendOtpEmail } from "../utils/sendEmail.js";

const cookieOptions = {
    httpOnly: true,
    secure: true,
};

const ACTIVE_TASK_STATUSES = ["open", "in_progress", "pending_manager_approval"]

// ── Utility functions ────────────────────────────────────────
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
//  1. MANAGER CREATES EMPLOYEE, TECHNICIAN, OR MANAGER
//     Route:  POST /api/users/manager/create-user
//     Access: Private — only logged-in manager
//     Body:   { fullName, email, username, password, role, department?, employeeId?, specialization? }
// ─────────────────────────────────────────────
const createUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password, role, department, employeeId, specialization } = req.body

    if ([fullName, email, username, password, role].some((f) => !f || f.trim() === "")) {
        throw new ApiError(400, "fullName, email, username, password and role are required")
    }

    if (!["employee", "technician", "manager"].includes(role)) {
        throw new ApiError(400, "Role must be 'employee', 'technician', or 'manager'")
    }
    const validSpecializations = ["general", "electronics", "electrical", "mechanical", "IT", "civil"]
    if (specialization && !validSpecializations.includes(specialization)) {
        throw new ApiError(400, "Specialization must be one of: general, electronics, electrical, mechanical, IT, civil")
    }

    if (department && !DEPARTMENTS.includes(department)) {
        throw new ApiError(400, `Department must be one of: ${DEPARTMENTS.join(", ")}`)
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
            specialization: specialization || null,
        },
        select: {
            id: true, username: true, email: true,
            fullName: true, role: true, department: true,
            employeeId: true, specialization: true, isActive: true,
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
        employeeId,
        specialization
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
    const employeeId = req.body?.employeeId || req.query?.employeeId
    const username = req.body?.username || req.query?.username
    const email = req.body?.email || req.query?.email

    if (!employeeId && !username && !email) {
        throw new ApiError(400, "Provide at least one of: employeeId, username, or email")
    }

    // Build OR conditions only for the fields that were supplied
    const orConditions = []
    if (employeeId) orConditions.push({ employeeId })
    if (username)   orConditions.push({ username: username.toLowerCase() })
    if (email)      orConditions.push({ email })

    const user = await prisma.user.findFirst({ where: { OR: orConditions } })
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    // prevent manager from deleting themselves
    if (user.id === req.user.id) {
        throw new ApiError(400, "You cannot delete your own account")
    }

    await prisma.user.delete({ where: { id: user.id } })

    return res.status(200).json(
        new ApiResponse(200, {}, `User '${user.username}' deleted successfully`)
    )
})

const listTechnicians = asyncHandler(async (req, res) => {
    const includeInactive = req.query.includeInactive === "true"

    const technicians = await prisma.user.findMany({
        where: {
            role: "technician",
            ...(includeInactive ? {} : { isActive: true }),
        },
        select: {
            id: true,
            fullName: true,
            username: true,
            email: true,
            employeeId: true,
            department: true,
            specialization: true,
            isActive: true,
            _count: {
                select: {
                    assignedTasks: {
                        where: {
                            status: { in: ACTIVE_TASK_STATUSES },
                        },
                    },
                },
            },
        },
        orderBy: [{ fullName: "asc" }],
    })

    const techniciansWithAvailability = technicians.map((tech) => ({
        id: tech.id,
        fullName: tech.fullName,
        username: tech.username,
        email: tech.email,
        employeeId: tech.employeeId,
        department: tech.department,
        specialization: tech.specialization,
        isActive: tech.isActive,
        activeTaskCount: tech._count.assignedTasks,
        isAvailableNow: tech._count.assignedTasks === 0,
    }))

    return res.status(200).json(
        new ApiResponse(
            200,
            { total: techniciansWithAvailability.length, technicians: techniciansWithAvailability },
            "Technicians fetched successfully"
        )
    )
})

const listAvailableTechnicians = asyncHandler(async (_req, res) => {
    const technicians = await prisma.user.findMany({
        where: {
            role: "technician",
            isActive: true,
        },
        select: {
            id: true,
            fullName: true,
            username: true,
            email: true,
            employeeId: true,
            department: true,
            specialization: true,
            _count: {
                select: {
                    assignedTasks: {
                        where: {
                            status: { in: ACTIVE_TASK_STATUSES },
                        },
                    },
                },
            },
        },
        orderBy: [{ fullName: "asc" }],
    })

    const availableTechnicians = technicians
        .filter((tech) => tech._count.assignedTasks === 0)  // ✅ Only technicians with NO active tasks
        .map((tech) => ({
            id: tech.id,
            fullName: tech.fullName,
            username: tech.username,
            email: tech.email,
            employeeId: tech.employeeId,
            department: tech.department,
            specialization: tech.specialization,
            activeTaskCount: 0,
            isAvailableNow: true,
        }))

    return res.status(200).json(
        new ApiResponse(
            200,
            { total: availableTechnicians.length, technicians: availableTechnicians },
            "Available technicians fetched successfully"
        )
    )
})

// ─────────────────────────────────────────────
//  GET AVAILABLE GENERAL TECHNICIANS (for periodic maintenance)
//     Route:  GET /users/manager/technicians/available-general
//     Access: Private (manager only)
// ─────────────────────────────────────────────
const listAvailableGeneralTechnicians = asyncHandler(async (_req, res) => {
    const technicians = await prisma.user.findMany({
        where: {
            role: "technician",
            isActive: true,
            OR: [
                { specialization: null },  // General technicians (no specialization)
                { specialization: "general" },  // General specialization type
            ],
        },
        select: {
            id: true,
            fullName: true,
            username: true,
            email: true,
            employeeId: true,
            department: true,
            specialization: true,
            _count: {
                select: {
                    assignedTasks: {
                        where: {
                            status: { in: ACTIVE_TASK_STATUSES },
                        },
                    },
                },
            },
        },
        orderBy: [{ fullName: "asc" }],
    })

    const availableTechnicians = technicians
        .filter((tech) => tech._count.assignedTasks === 0)  // Only technicians with NO active tasks
        .map((tech) => ({
            id: tech.id,
            fullName: tech.fullName,
            username: tech.username,
            email: tech.email,
            employeeId: tech.employeeId,
            department: tech.department,
            specialization: tech.specialization,
            activeTaskCount: 0,
            isAvailableNow: true,
        }))

    return res.status(200).json(
        new ApiResponse(
            200,
            { total: availableTechnicians.length, technicians: availableTechnicians },
            "Available general technicians fetched successfully"
        )
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


// ─────────────────────────────────────────────
//  LIST ALL USERS
//  Route:  GET /api/users/manager/all-users
//  Access: Private (manager only)
// ─────────────────────────────────────────────
const listAllUsers = asyncHandler(async (req, res) => {
    const allUsers = await prisma.user.findMany({
        select: {
            id: true,
            fullName: true,
            username: true,
            email: true,
            role: true,
            department: true,
            employeeId: true,
            specialization: true,
            isActive: true,
            createdAt: true,
        },
        orderBy: [{ fullName: "asc" }],
    })

    return res.status(200).json(
        new ApiResponse(
            200,
            { total: allUsers.length, users: allUsers },
            "All users fetched successfully"
        )
    )
})


// ─────────────────────────────────────────────
//  SEND OTP FOR PASSWORD RESET
//  Route:  POST /api/users/send-otp
//  Access: Public
//  Body:   { email }
// ─────────────────────────────────────────────
const sendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body

    if (!email) {
        throw new ApiError(400, "Email is required")
    }

    const user = await prisma.user.findUnique({
        where: { email }
    })

    if (!user) {
        throw new ApiError(404, "User with this email does not exist")
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Save OTP to database
    await prisma.user.update({
        where: { id: user.id },
        data: {
            resetOtp: otp,
            otpExpiresAt
        }
    })

    // Send OTP email
    await sendOtpEmail({
        email: user.email,
        otp,
        fullName: user.fullName
    })

    return res.status(200).json(
        new ApiResponse(200, {}, "OTP sent to your email successfully")
    )
})

// ─────────────────────────────────────────────
//  VERIFY OTP
//  Route:  POST /api/users/verify-otp
//  Access: Public
//  Body:   { email, otp }
// ─────────────────────────────────────────────
const verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body

    if (!email || !otp) {
        throw new ApiError(400, "Email and OTP are required")
    }

    const user = await prisma.user.findUnique({
        where: { email }
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    if (!user.resetOtp || user.resetOtp !== otp) {
        throw new ApiError(400, "Invalid OTP")
    }

    if (new Date() > user.otpExpiresAt) {
        throw new ApiError(400, "OTP has expired. Please request a new one")
    }

    // OTP is valid, return a temporary token for password reset
    const resetToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
    )

    return res.status(200).json(
        new ApiResponse(200, { resetToken }, "OTP verified successfully")
    )
})

// ─────────────────────────────────────────────
//  RESET PASSWORD
//  Route:  POST /api/users/reset-password
//  Access: Public (with reset token)
//  Body:   { email, newPassword, resetToken }
// ─────────────────────────────────────────────
const resetPassword = asyncHandler(async (req, res) => {
    const { email, newPassword, resetToken } = req.body

    if (!email || !newPassword || !resetToken) {
        throw new ApiError(400, "Email, new password and reset token are required")
    }

    if (newPassword.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters")
    }

    // Verify reset token
    let decoded
    try {
        decoded = jwt.verify(resetToken, process.env.ACCESS_TOKEN_SECRET)
    } catch (error) {
        throw new ApiError(401, "Invalid or expired reset token")
    }

    if (decoded.email !== email) {
        throw new ApiError(401, "Invalid reset token for this email")
    }

    const user = await prisma.user.findUnique({
        where: { email }
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password and clear OTP
    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            resetOtp: null,
            otpExpiresAt: null
        }
    })

    return res.status(200).json(
        new ApiResponse(200, {}, "Password reset successfully. You can now login with your new password")
    )
})


export {
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
};