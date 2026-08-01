import express from "express";
import {
  createSite,
  deleteSite,
  getSites,
  updateSite,
} from "../controllers/siteController.js";
import {
  authenticate,
  authorize,
} from "../middleware/authenticate.js";
import { validateObjectId } from "../middleware/validateObjectId.js";

const router = express.Router();

router.use(authenticate);
router.get("/", getSites);
router.post("/", authorize("company_admin"), createSite);
router.patch(
  "/:siteId",
  authorize("company_admin"),
  validateObjectId("siteId"),
  updateSite
);
router.delete(
  "/:siteId",
  authorize("company_admin"),
  validateObjectId("siteId"),
  deleteSite
);

export default router;
