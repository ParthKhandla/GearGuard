const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")

const app = express()

const allowedOrigins = [
    process.env.CORS_ORIGIN,
    "https://gear-guard-alpha.vercel.app",
    "https://gearguard-frontend.onrender.com"
].filter(Boolean)

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

const userRouter = require('./routes/user.routes.js')
const machineRouter = require('./routes/machine.routes.js')
const taskRouter = require('./routes/task.routes.js')

app.use("/api/v1/users",    userRouter)
app.use("/api/v1/machines", machineRouter)
app.use("/api/v1/tasks",    taskRouter)

// ─────────────────────────────────────────────
// Error Handling Middleware
// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500
    const message = err.message || "Internal Server Error"
    
    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: err.errors || [],
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    })
})

module.exports = {app}