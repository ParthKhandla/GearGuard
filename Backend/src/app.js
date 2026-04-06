import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

import userRouter from './routes/user.routes.js'
import machineRouter from './routes/machine.routes.js'
import taskRouter from './routes/task.routes.js'

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

export {app}