import express from "express";
import { getCompanyProfile, updateCompanyProfile } from "../controllers/companyController.js";
import { authenticate, authorize } from "../middleware/authenticate.js";
const router = express.Router();
router.use(authenticate);
router.get("/profile", getCompanyProfile);
router.patch("/profile", authorize("company_admin"), updateCompanyProfile);
export default router;
