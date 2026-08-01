import express from "express";

import {
  createUser,
  getUsers,
  resetUserPassword,
  updateUser,
} from "../controllers/userController.js";

import {
  authenticate,
  authorize,
} from "../middleware/authenticate.js";

import {
  validateObjectId,
} from "../middleware/validateObjectId.js";

const router = express.Router();

router.use(authenticate);
router.use(
  authorize("company_admin")
);

router.get("/", getUsers);
router.post("/", createUser);

router.patch(
  "/:userId",
  validateObjectId("userId"),
  updateUser
);

router.patch(
  "/:userId/password",
  validateObjectId("userId"),
  resetUserPassword
);

export default router;
