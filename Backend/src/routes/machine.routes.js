const { Router } = require("express");
const {
    createMachine,
    listMachines,
    getMachine,
    deleteMachine,
    updateMachine,
    getMachinesDueForMaintenance,
} = require("../controllers/machine.controller.js");
const { verifyJWT, authorizeRoles } = require("../middlewares/auth.middleware.js");

const router = Router();

// All machine routes require authentication
router.use(verifyJWT);

router.get  ("/due-for-maintenance", getMachinesDueForMaintenance);
router.post ("/",                    createMachine);
router.get  ("/",                    listMachines);
router.get  ("/:machineId",          getMachine);
router.put  ("/:machineId",          updateMachine);
router.delete("/:machineId",         deleteMachine);

module.exports = router;
