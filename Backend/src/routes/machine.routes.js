import { Router } from "express";
import {
    createMachine,
    listMachines,
    getMachine,
    deleteMachine,
    updateMachine,
    getMachinesDueForMaintenance,
} from "../controllers/machine.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = Router();

// All machine routes require authentication
router.use(verifyJWT);

router.get  ("/due-for-maintenance", getMachinesDueForMaintenance);
router.post ("/",                    createMachine);
router.get  ("/",                    listMachines);
router.get  ("/:machineId",          getMachine);
router.put  ("/:machineId",          updateMachine);
router.delete("/:machineId",         deleteMachine);

export default router;
