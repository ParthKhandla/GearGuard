const { asyncHandler } = require("../utils/asyncHandler.js");
const { ApiError } = require("../utils/ApiError.js");
const { prisma } = require("../db/index.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const { DEPARTMENTS } = require("../constants.js");

const parseMaintenanceDates = (lastMaintenanceDate, intervalDays) => {
    let lastDate = null
    let nextDate = null

    if (lastMaintenanceDate) {
        lastDate = new Date(lastMaintenanceDate)
        if (isNaN(lastDate.getTime())) {
            throw new ApiError(400, "Invalid lastMaintenanceDate format. Use ISO 8601 e.g. 2026-03-01")
        }

        nextDate = new Date(lastDate)
        nextDate.setDate(nextDate.getDate() + intervalDays)
    }

    return { lastDate, nextDate }
}

const machineSelect = {
    id: true,
    machineId: true,
    name: true,
    category: true,
    department: true,
    maintenanceIntervalDays: true,
    lastMaintenanceDate: true,
    nextMaintenanceDate: true,
    createdBy: true,
    createdAt: true,
    updatedAt: true,
}

const createMachine = asyncHandler(async (req, res) => {
    const {
        machineId,
        name,
        category,
        department,
        maintenanceIntervalDays,
        lastMaintenanceDate,
    } = req.body

    if ([machineId, name, category, department].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "machineId, name, category, and department are required")
    }

    if (!DEPARTMENTS.includes(department)) {
        throw new ApiError(400, `Department must be one of: ${DEPARTMENTS.join(", ")}`)
    }

    const intervalDays = Number(maintenanceIntervalDays)
    if (!Number.isInteger(intervalDays) || intervalDays <= 0) {
        throw new ApiError(400, "maintenanceIntervalDays must be a positive integer")
    }

    const existingMachine = await prisma.machine.findUnique({ where: { machineId } })
    if (existingMachine) {
        throw new ApiError(409, "A machine with this machineId already exists")
    }

    const { lastDate, nextDate } = parseMaintenanceDates(lastMaintenanceDate, intervalDays)

    const machine = await prisma.machine.create({
        data: {
            machineId,
            name,
            category,
            department,
            maintenanceIntervalDays: intervalDays,
            lastMaintenanceDate: lastDate,
            nextMaintenanceDate: nextDate,
            createdBy: req.user.id,
        },
        select: machineSelect,
    })

    return res.status(201).json(
        new ApiResponse(201, machine, "Machine created successfully")
    )
})

const listMachines = asyncHandler(async (req, res) => {
    const { category, department, search } = req.query

    const filters = {}

    if (category) {
        filters.category = { contains: category, mode: "insensitive" }
    }

    if (department) {
        filters.department = { contains: department, mode: "insensitive" }
    }

    if (search) {
        filters.OR = [
            { machineId: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
        ]
    }

    const machines = await prisma.machine.findMany({
        where: filters,
        select: {
            ...machineSelect,
            creator: {
                select: { id: true, fullName: true, username: true },
            },
            _count: {
                select: {
                    tasks: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    })

    return res.status(200).json(
        new ApiResponse(200, { total: machines.length, machines }, "Machines fetched successfully")
    )
})

const getMachine = asyncHandler(async (req, res) => {
    const { machineId } = req.params

    const machine = await prisma.machine.findUnique({
        where: { machineId },
        include: {
            creator: {
                select: { id: true, fullName: true, username: true },
            },
            tasks: {
                select: {
                    id: true,
                    title: true,
                    severity: true,
                    status: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
            },
        },
    })

    if (!machine) {
        throw new ApiError(404, "Machine not found")
    }

    return res.status(200).json(
        new ApiResponse(200, machine, "Machine fetched successfully")
    )
})

const updateMachine = asyncHandler(async (req, res) => {
    const { machineId } = req.params
    const { name, category, department, maintenanceIntervalDays, lastMaintenanceDate } = req.body

    const machine = await prisma.machine.findUnique({
        where: { id: parseInt(machineId) }
    })

    if (!machine) {
        throw new ApiError(404, "Machine not found")
    }

    if (department && !DEPARTMENTS.includes(department)) {
        throw new ApiError(400, `Department must be one of: ${DEPARTMENTS.join(", ")}`)
    }

    const { lastDate, nextDate } = parseMaintenanceDates(lastMaintenanceDate, maintenanceIntervalDays)

    const updated = await prisma.machine.update({
        where: { id: parseInt(machineId) },
        data: {
            name: name || machine.name,
            category: category || machine.category,
            department: department || machine.department,
            maintenanceIntervalDays: maintenanceIntervalDays ? parseInt(maintenanceIntervalDays) : machine.maintenanceIntervalDays,
            lastMaintenanceDate: lastDate,
            nextMaintenanceDate: nextDate,
        },
        select: machineSelect,
    })

    return res
        .status(200)
        .json(new ApiResponse(200, updated, "Machine updated successfully"))
})

const deleteMachine = asyncHandler(async (req, res) => {
    const { machineId } = req.params

    const machine = await prisma.machine.findUnique({
        where: { id: parseInt(machineId) },
    })

    if (!machine) {
        throw new ApiError(404, "Machine not found")
    }

    await prisma.machine.delete({ where: { id: parseInt(machineId) } })

    return res.status(200).json(
        new ApiResponse(200, {}, `Machine '${machine.name}' deleted successfully`)
    )
})

const getMachinesDueForMaintenance = asyncHandler(async (req, res) => {
    const { days = 7 } = req.query

    const daysToCheck = parseInt(days) || 7
    const today = new Date()
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + daysToCheck)

    // Get all machines due for maintenance
    let machinesDue = await prisma.machine.findMany({
        where: {
            nextMaintenanceDate: {
                lte: endDate,
                gte: today,
            },
        },
        select: { ...machineSelect, tasks: { select: { id: true, status: true } } },
        orderBy: {
            nextMaintenanceDate: 'asc',
        },
    })

    let machinesOverdue = await prisma.machine.findMany({
        where: {
            nextMaintenanceDate: {
                lt: today,
            },
        },
        select: { ...machineSelect, tasks: { select: { id: true, status: true } } },
        orderBy: {
            nextMaintenanceDate: 'asc',
        },
    })

    // Filter out machines that have active maintenance tasks (in_progress or pending_manager_approval)
    const ACTIVE_TASK_STATUSES = ["in_progress", "pending_manager_approval"]
    
    machinesDue = machinesDue.filter(machine => {
        const hasActiveTask = machine.tasks.some(task => ACTIVE_TASK_STATUSES.includes(task.status))
        return !hasActiveTask
    })

    machinesOverdue = machinesOverdue.filter(machine => {
        const hasActiveTask = machine.tasks.some(task => ACTIVE_TASK_STATUSES.includes(task.status))
        return !hasActiveTask
    })

    // Remove the tasks field from response
    machinesDue = machinesDue.map(({ tasks, ...machine }) => machine)
    machinesOverdue = machinesOverdue.map(({ tasks, ...machine }) => machine)

    return res.status(200).json(
        new ApiResponse(200, { 
            overdue: machinesOverdue, 
            upcoming: machinesDue,
            total: machinesOverdue.length + machinesDue.length
        }, "Machines requiring maintenance fetched successfully")
    )
})

module.exports = { createMachine, listMachines, getMachine, updateMachine, deleteMachine, getMachinesDueForMaintenance }