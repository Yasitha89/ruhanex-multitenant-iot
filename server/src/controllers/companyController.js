import Tenant from "../models/Tenant.js";

const DATE_FORMATS = ["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY", "DD-MMM-YYYY"];
const THEMES = ["light", "dark", "system"];
const LANGUAGES = ["en", "si", "ta"];
const text = (v) => String(v || "").trim();
const currency = (v) => text(v).toUpperCase();
const unique = (arr) => [...new Set((Array.isArray(arr) ? arr : []).map(text).filter(Boolean))];

function normalizeShifts(value) {
  return (Array.isArray(value) ? value : []).map((shift) => ({
    name: text(shift.name),
    startTime: text(shift.startTime),
    endTime: text(shift.endTime),
    crossesMidnight: Boolean(shift.crossesMidnight),
    enabled: shift.enabled !== false,
  }));
}

function validateShifts(shifts) {
  if (!shifts.length) return "At least one working shift is required";
  const names = new Set();
  const validTime = (v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
  for (const shift of shifts) {
    if (!shift.name || !validTime(shift.startTime) || !validTime(shift.endTime)) {
      return "Each shift requires a name, valid start time and valid end time";
    }
    const n = shift.name.toLowerCase();
    if (names.has(n)) return "Shift names must be unique";
    names.add(n);
  }
  return null;
}

function response(tenant) {
  return {
    id: tenant._id, name: tenant.name, slug: tenant.slug, plan: tenant.plan,
    status: tenant.status, timezone: tenant.timezone, currency: tenant.currency,
    dateFormat: tenant.dateFormat, dashboardTheme: tenant.dashboardTheme,
    defaultLanguage: tenant.defaultLanguage, productionUnits: tenant.productionUnits,
    shifts: tenant.shifts, branding: tenant.branding, limits: tenant.limits,
    updatedAt: tenant.updatedAt,
  };
}

export async function getCompanyProfile(req, res, next) {
  try {
    const tenant = await Tenant.findOne({ _id: req.user.tenantId, status: "active" }).lean();
    if (!tenant) return res.status(404).json({ success: false, error: "Company profile not found" });
    return res.json({ success: true, company: response(tenant) });
  } catch (error) { next(error); }
}

export async function updateCompanyProfile(req, res, next) {
  try {
    const name = text(req.body?.name);
    const displayName = text(req.body?.branding?.companyDisplayName);
    const logoUrl = text(req.body?.branding?.logoUrl);
    const timezone = text(req.body?.timezone);
    const curr = currency(req.body?.currency);
    const dateFormat = text(req.body?.dateFormat);
    const dashboardTheme = text(req.body?.dashboardTheme);
    const defaultLanguage = text(req.body?.defaultLanguage);
    const primary = text(req.body?.productionUnits?.primary);
    const available = unique(req.body?.productionUnits?.available);
    const shifts = normalizeShifts(req.body?.shifts);

    if (!name || !displayName || !timezone) return res.status(400).json({ success: false, error: "Company name, display name and timezone are required" });
    if (!/^[A-Z]{3}$/.test(curr)) return res.status(400).json({ success: false, error: "Currency must be a three-letter ISO code" });
    if (!DATE_FORMATS.includes(dateFormat)) return res.status(400).json({ success: false, error: "Invalid date format" });
    if (!THEMES.includes(dashboardTheme)) return res.status(400).json({ success: false, error: "Invalid dashboard theme" });
    if (!LANGUAGES.includes(defaultLanguage)) return res.status(400).json({ success: false, error: "Invalid default language" });
    if (!primary) return res.status(400).json({ success: false, error: "Primary production unit is required" });
    if (!available.includes(primary)) available.unshift(primary);
    const shiftError = validateShifts(shifts);
    if (shiftError) return res.status(400).json({ success: false, error: shiftError });

    const tenant = await Tenant.findOneAndUpdate(
      { _id: req.user.tenantId, status: "active" },
      { $set: {
        name, timezone, currency: curr, dateFormat, dashboardTheme, defaultLanguage,
        productionUnits: { primary, available }, shifts,
        branding: { companyDisplayName: displayName, logoUrl },
        updatedBy: req.user.userId,
      } },
      { new: true, runValidators: true }
    ).lean();

    if (!tenant) return res.status(404).json({ success: false, error: "Company profile not found" });
    return res.json({ success: true, company: response(tenant) });
  } catch (error) { next(error); }
}
