import express from "express";
import {
  createDevice,
  deactivateDevice,
  getDeviceById,
  getDevices,
  getNavigationDevices,
  updateDevice,
} from "../controllers/deviceController.js";
import {
  authenticate,
  authorize,
} from "../middleware/authenticate.js";
import { validateObjectId } from "../middleware/validateObjectId.js";

const router = express.Router();

router.use(authenticate);

router.get("/navigation", getNavigationDevices);
router.get("/", getDevices);
router.get("/:deviceId", validateObjectId("deviceId"), getDeviceById);
router.post("/", authorize("company_admin"), createDevice);
router.patch(
  "/:deviceId",
  authorize("company_admin"),
  validateObjectId("deviceId"),
  updateDevice
);
router.delete(
  "/:deviceId",
  authorize("company_admin"),
  validateObjectId("deviceId"),
  deactivateDevice
);

export default router;
