import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../db/index.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { sendTaskAssignmentEmail } from "../utils/sendEmail.js";

const VALID_SEVERITIES = ["warning", "critical", "low", "moderate"]
const VALID_STATUSES = ["open", "in_progress", "pending_manager_approval", "resolved"]
const ACTIVE_STATUSES = ["open", "in_progress", "pending_manager_approval"]
const COMPLETED_STATUSES = ["resolved"]

const taskSelect = {
    id: true,
    title: true,
    description: true,
    severity: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    machine: {
        select: {
            id: true,
            machineId: true,
            name: true,
            category: true,
            department: true,
        },
    },
    reporter: {
        select: {
            id: true,
            fullName: true,
            username: true,
            employeeId: true,
        },
    },
    assignee: {
        select: {
            id: true,
            fullName: true,
            username: true,
            employeeId: true,
        },
    },
}

const reportTask = asyncHandler(async (req, res) => {
    const { machineId, title, description, severity } = req.body

    // Check required fields
    if (!machineId || !title || !description || !severity) {
        throw new ApiError(400, "machineId, title, description, and severity are required")
    }

    // Validate string fields
    if (typeof title !== 'string' || title.trim() === "") {
        throw new ApiError(400, "Title is required and must be a valid string")
    }

    if (typeof description !== 'string' || description.trim() === "") {
        throw new ApiError(400, "Description is required and must be a valid string")
    }

    // Validate severity
    if (!VALID_SEVERITIES.includes(severity)) {
        throw new ApiError(400, "severity must be one of: low, moderate, warning, critical")
    }

    // Convert machineId to number
    const machineIdNum = Number(machineId)
    if (!Number.isInteger(machineIdNum) || machineIdNum <= 0) {
        throw new ApiError(400, "machineId must be a valid number")
    }

    const machine = await prisma.machine.findUnique({ where: { id: machineIdNum } })
    if (!machine) {
        throw new ApiError(404, "Machine not found")
    }

    const task = await prisma.task.create({
        data: {
            machineRefId: machine.id,
            reportedBy: req.user.id,
            title: title.trim(),
            description: description.trim(),
            severity,
        },
        select: taskSelect,
    })

    return res.status(201).json(
        new ApiResponse(201, task, "Task reported successfully")
    )
})

const listTasks = asyncHandler(async (req, res) => {
    const { severity, status, assignedTo, machineId, search, view } = req.query

    const filters = {}

    // ✅ Employees can only see tasks they reported
    if (req.user.role === 'employee') {
        filters.reportedBy = req.user.id
    }

    // ✅ Technicians can see tasks they reported OR tasks assigned to them
    if (req.user.role === 'technician') {
        filters.OR = [
            { reportedBy: req.user.id },
            { assignedTo: req.user.id }
        ]
    }

    if (severity) {
        if (!VALID_SEVERITIES.includes(severity)) {
            throw new ApiError(400, "severity must be either 'warning' or 'critical'")
        }
        filters.severity = severity
    }

    if (status) {
        if (!VALID_STATUSES.includes(status)) {
            throw new ApiError(400, "status must be one of: open, in_progress, pending_manager_approval, resolved")
        }
        filters.status = status
    } else if (view) {
        if (!["active", "completed", "all"].includes(view)) {
            throw new ApiError(400, "view must be one of: active, completed, all")
        }

        if (view === "active") {
            filters.status = { in: ACTIVE_STATUSES }
        }

        if (view === "completed") {
            filters.status = { in: COMPLETED_STATUSES }
        }
    }

    if (assignedTo === "unassigned") {
        filters.assignedTo = null
    } else if (assignedTo) {
        const assignedUserId = Number(assignedTo)
        if (!Number.isInteger(assignedUserId) || assignedUserId <= 0) {
            throw new ApiError(400, "assignedTo must be a valid user id or 'unassigned'")
        }
        filters.assignedTo = assignedUserId
    }

    if (machineId) {
        filters.machine = { machineId }
    }

    if (search) {
        filters.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { machine: { machineId: { contains: search, mode: "insensitive" } } },
            { machine: { name: { contains: search, mode: "insensitive" } } },
        ]
    }

    const tasks = await prisma.task.findMany({
        where: filters,
        select: taskSelect,
        orderBy: [
            { createdAt: "desc" },
        ],
    })

    return res.status(200).json(
        new ApiResponse(200, { total: tasks.length, tasks }, "Tasks fetched successfully")
    )
})

const getTask = asyncHandler(async (req, res) => {
    const taskId = Number(req.params.taskId)

    if (!Number.isInteger(taskId) || taskId <= 0) {
        throw new ApiError(400, "taskId must be a valid number")
    }

    const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: taskSelect,
    })

    if (!task) {
        throw new ApiError(404, "Task not found")
    }

    return res.status(200).json(
        new ApiResponse(200, task, "Task fetched successfully")
    )
})

const assignTask = asyncHandler(async (req, res) => {
    const taskId = Number(req.params.taskId)
    const { assignedTo } = req.body

    if (!Number.isInteger(taskId) || taskId <= 0) {
        throw new ApiError(400, "taskId must be a valid number")
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task) {
        throw new ApiError(404, "Task not found")
    }

    if (assignedTo === null) {
        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: { assignedTo: null, status: "open" },
            select: taskSelect,
        })

        return res.status(200).json(
            new ApiResponse(200, updatedTask, "Task unassigned successfully")
        )
    }

    const technicianId = Number(assignedTo)
    if (!Number.isInteger(technicianId) || technicianId <= 0) {
        throw new ApiError(400, "assignedTo must be a valid technician id or null")
    }

    const technician = await prisma.user.findUnique({ where: { id: technicianId } })
    if (!technician || technician.role !== "technician") {
        throw new ApiError(400, "assignedTo must belong to an existing technician")
    }

    // Fetch full task details including machine
    const fullTask = await prisma.task.findUnique({
        where: { id: taskId },
        include: { machine: true, reporter: true }
    })

    const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: {
            assignedTo: technicianId,
            status: task.status === "open" ? "in_progress" : task.status,
        },
        select: taskSelect,
    })

    // Send email notification to technician
    try {
        await sendTaskAssignmentEmail({
            technicianEmail: technician.email,
            technicianName: technician.fullName,
            taskTitle: fullTask.title,
            taskDescription: fullTask.description,
            machineName: fullTask.machine.name,
            machineId: fullTask.machine.machineId,
            category: fullTask.machine.category,
            department: fullTask.machine.department,
            severity: fullTask.severity
        })
    } catch (emailError) {
        console.error("Failed to send task assignment email:", emailError)
        // Don't fail the request if email fails
    }

    return res.status(200).json(
        new ApiResponse(200, updatedTask, "Task assigned successfully")
    )
})

const updateTaskStatus = asyncHandler(async (req, res) => {
    const taskId = Number(req.params.taskId)
    const { status } = req.body

    if (!Number.isInteger(taskId) || taskId <= 0) {
        throw new ApiError(400, "taskId must be a valid number")
    }

    if (!VALID_STATUSES.includes(status)) {
        throw new ApiError(400, "status must be one of: open, in_progress, pending_manager_approval, resolved")
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task) {
        throw new ApiError(404, "Task not found")
    }

    if (req.user.role === "technician" && task.assignedTo !== req.user.id) {
        throw new ApiError(403, "You can only update tasks assigned to you")
    }

    if (req.user.role === "technician") {
        if (status === "resolved") {
            throw new ApiError(403, "Technicians cannot directly resolve tasks. Submit for manager approval first")
        }

        if (!["in_progress", "pending_manager_approval"].includes(status)) {
            throw new ApiError(403, "Technicians can only set status to in_progress or pending_manager_approval")
        }
    }

    if (status === "in_progress" && !task.assignedTo) {
        throw new ApiError(400, "Assign a technician before moving task to in_progress")
    }

    if (status === "pending_manager_approval" && !task.assignedTo) {
        throw new ApiError(400, "Assign a technician before requesting manager approval")
    }

    const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: { status },
        select: taskSelect,
    })

    return res.status(200).json(
        new ApiResponse(200, updatedTask, "Task status updated successfully")
    )
})

const reviewTaskResolution = asyncHandler(async (req, res) => {
    const taskId = Number(req.params.taskId)
    const { decision } = req.body

    if (!Number.isInteger(taskId) || taskId <= 0) {
        throw new ApiError(400, "taskId must be a valid number")
    }

    if (!["approve", "reject"].includes(decision)) {
        throw new ApiError(400, "decision must be either 'approve' or 'reject'")
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } })
    if (!task) {
        throw new ApiError(404, "Task not found")
    }

    if (task.status !== "pending_manager_approval") {
        throw new ApiError(400, "Only tasks pending manager approval can be reviewed")
    }

    const nextStatus = decision === "approve" ? "resolved" : "in_progress"

    const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: { status: nextStatus },
        select: taskSelect,
    })

    // If task is approved and resolved, update machine maintenance dates
    if (decision === "approve") {
        const machine = await prisma.machine.findUnique({
            where: { id: task.machineRefId }
        })

        if (machine) {
            const today = new Date()
            const nextDate = new Date(today)
            nextDate.setDate(nextDate.getDate() + machine.maintenanceIntervalDays)

            await prisma.machine.update({
                where: { id: task.machineRefId },
                data: {
                    lastMaintenanceDate: today,
                    nextMaintenanceDate: nextDate
                }
            })
        }
    }

    const message = decision === "approve"
        ? "Task approved and marked as resolved"
        : "Task review rejected and moved back to in_progress"

    return res.status(200).json(
        new ApiResponse(200, updatedTask, message)
    )
})

export { reportTask, listTasks, getTask, assignTask, updateTaskStatus, reviewTaskResolution }