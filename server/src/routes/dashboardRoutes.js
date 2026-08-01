// import express from "express";
// import { getDeviceDashboard } from "../controllers/dashboardController.js";
// import { authenticate } from "../middleware/authenticate.js";
// import { validateObjectId } from "../middleware/validateObjectId.js";

// const router = express.Router();

// router.use(authenticate);
// router.get(
//   "/devices/:deviceId/dashboard",
//   validateObjectId("deviceId"),
//   getDeviceDashboard
// );

// export default router;
import express from "express";

import { getDeviceDashboard } from "../controllers/dashboardController.js";

import { authenticate } from "../middleware/authenticate.js";

import { validateObjectId } from "../middleware/validateObjectId.js";

const router = express.Router();

/*
 * Do not use router.use(authenticate) here when this router
 * is mounted at /api.
 *
 * Apply authentication only to the protected route.
 */
router.get(
  "/devices/:deviceId/dashboard",
  authenticate,
  validateObjectId("deviceId"),
  getDeviceDashboard,
);

export default router;
