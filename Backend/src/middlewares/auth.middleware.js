const jwt = require("jsonwebtoken");
const { ApiError } = require("../utils/ApiError.js");
const { prisma } = require("../db/index.js");
const { asyncHandler } = require("../utils/asyncHandler.js");

// ─────────────────────────────────────────────
//  1. verifyJWT
// ─────────────────────────────────────────────
const verifyJWT = asyncHandler(async (req, _, next) => {
    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(401, "Unauthorized – no token provided");
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                username: true,
                email: true,
                fullName: true,
                role: true,
                department: true,
                employeeId: true,
                isActive: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            throw new ApiError(401, "Invalid access token");
        }

        if (!user.isActive) {
            throw new ApiError(403, "Your account has been deactivated. Contact your manager.");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, "Invalid or expired access token");
    }
});


// ─────────────────────────────────────────────
//  2. authorizeRoles(...roles)
// ─────────────────────────────────────────────
const authorizeRoles = (...roles) => {
    return (req, _, next) => {
        if (!req.user) {
            throw new ApiError(401, "Authentication required");
        }
        if (!roles.includes(req.user.role)) {
            throw new ApiError(
                403,
                `Access denied. This route is accessible to: ${roles.join(", ")} only.`
            );
        }
        next();
    };
};

module.exports = { verifyJWT, authorizeRoles };