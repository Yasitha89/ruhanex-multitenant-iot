import User from "../models/User.js";
import Tenant from "../models/Tenant.js";
import {
  getAuthCookieName,
  verifyAccessToken,
} from "../services/tokenService.js";

export async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.[getAuthCookieName()];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    let decoded;

    try {
      decoded = verifyAccessToken(token);
    } catch {
      return res.status(401).json({
        success: false,
        error: "Session is invalid or expired",
      });
    }

    const user = await User.findOne({
      _id: decoded.userId,
      tenantId: decoded.tenantId,
      status: "active",
    }).select("_id tenantId name email role status allowedSiteIds lastLoginAt");

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User account is unavailable",
      });
    }

    const tenant = await Tenant.findOne({
      _id: user.tenantId,
      status: "active",
    }).select("_id name slug status plan timezone branding limits");

    if (!tenant) {
      return res.status(403).json({
        success: false,
        error: "Company account is unavailable",
      });
    }

    req.user = {
      userId: user._id.toString(),
      tenantId: user.tenantId.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      allowedSiteIds: user.allowedSiteIds.map(String),
    };

    req.tenant = {
      id: tenant._id.toString(),
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan,
      timezone: tenant.timezone,
      branding: tenant.branding,
      limits: tenant.limits,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function authorize(...allowedRoles) {
  return function authorizationMiddleware(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "You do not have permission to perform this action",
      });
    }

    next();
  };
}
