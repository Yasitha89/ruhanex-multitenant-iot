import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  startTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  endTime: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  crossesMidnight: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },
}, { _id: true });

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 150 },
  slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 100 },
  status: { type: String, enum: ["active", "suspended", "inactive"], default: "active" },
  plan: { type: String, enum: ["starter", "professional", "enterprise"], default: "starter" },
  timezone: { type: String, default: "Asia/Colombo" },
  currency: { type: String, trim: true, uppercase: true, default: "LKR", maxlength: 3 },
  dateFormat: { type: String, enum: ["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY", "DD-MMM-YYYY"], default: "YYYY-MM-DD" },
  dashboardTheme: { type: String, enum: ["light", "dark", "system"], default: "system" },
  defaultLanguage: { type: String, enum: ["en", "si", "ta"], default: "en" },
  productionUnits: {
    primary: { type: String, trim: true, default: "m²" },
    available: { type: [String], default: ["m²", "pieces"] },
  },
  shifts: { type: [shiftSchema], default: [
    { name: "06-14", startTime: "06:00", endTime: "14:00", crossesMidnight: false, enabled: true },
    { name: "14-22", startTime: "14:00", endTime: "22:00", crossesMidnight: false, enabled: true },
    { name: "22-06", startTime: "22:00", endTime: "06:00", crossesMidnight: true, enabled: true },
  ] },
  limits: {
    sites: { type: Number, default: 1, min: 1 },
    users: { type: Number, default: 5, min: 1 },
    devices: { type: Number, default: 5, min: 1 },
  },
  branding: {
    companyDisplayName: { type: String, trim: true, maxlength: 150 },
    logoUrl: { type: String, trim: true, default: "" },
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

tenantSchema.index({ slug: 1 }, { unique: true });
export default mongoose.model("Tenant", tenantSchema);
