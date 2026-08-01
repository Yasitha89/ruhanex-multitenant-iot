import Tenant from "../models/Tenant.js";
import User from "../models/User.js";
import {
  clearAuthCookie,
  createAccessToken,
  setAuthCookie,
} from "../services/tokenService.js";

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export async function login(req, res, next) {
  try {
    const companyCode = normalize(req.body?.companyCode);
    const email = normalize(req.body?.email);
    const password = String(req.body?.password || "");

    if (!companyCode || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Company code, email and password are required",
      });
    }

    const tenant = await Tenant.findOne({
      slug: companyCode,
      status: "active",
    }).select("_id name slug status plan timezone branding limits");

    if (!tenant) {
      return res.status(401).json({
        success: false,
        error: "Invalid login details",
      });
    }

    const user = await User.findOne({
      tenantId: tenant._id,
      email,
      status: "active",
    }).select("+passwordHash");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        error: "Invalid login details",
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    setAuthCookie(res, createAccessToken(user));

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        allowedSiteIds: user.allowedSiteIds,
      },
      tenant: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        timezone: tenant.timezone,
        branding: tenant.branding,
        limits: tenant.limits,
      },
    });
  } catch (error) {
    next(error);
  }
}

export function getCurrentUser(req, res) {
  return res.json({
    success: true,
    user: req.user,
    tenant: req.tenant,
  });
}

export function logout(req, res) {
  clearAuthCookie(res);

  return res.json({
    success: true,
    message: "Logged out successfully",
  });
}
// import Tenant from "../models/Tenant.js";
// import User from "../models/User.js";

// import {
//   clearAuthCookie,
//   createAccessToken,
//   setAuthCookie,
// } from "../services/tokenService.js";

// function normalize(value) {
//   return String(value || "")
//     .trim()
//     .toLowerCase();
// }

// export async function login(req, res, next) {
//   try {
//     const companyCode = normalize(req.body?.companyCode);

//     const email = normalize(req.body?.email);

//     const password = String(req.body?.password || "");

//     console.log("Login attempt:", {
//       companyCode,
//       email,
//       hasPassword: Boolean(password),
//     });

//     if (!companyCode || !email || !password) {
//       return res.status(400).json({
//         success: false,
//         error: "Company code, email and password are required",
//       });
//     }

//     const tenant = await Tenant.findOne({
//       slug: companyCode,
//       status: "active",
//     }).select("_id name slug status plan timezone branding limits");

//     console.log("Tenant found:", Boolean(tenant));

//     if (!tenant) {
//       return res.status(401).json({
//         success: false,
//         error: "Invalid login details",
//       });
//     }

//     const user = await User.findOne({
//       tenantId: tenant._id,
//       email,
//       status: "active",
//     }).select("+passwordHash");

//     console.log("User found:", Boolean(user));

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         error: "Invalid login details",
//       });
//     }

//     const passwordValid = await user.comparePassword(password);

//     console.log("Password valid:", passwordValid);

//     if (!passwordValid) {
//       return res.status(401).json({
//         success: false,
//         error: "Invalid login details",
//       });
//     }

//     user.lastLoginAt = new Date();
//     await user.save();

//     const token = createAccessToken(user);

//     setAuthCookie(res, token);

//     console.log("Authentication cookie created:", Boolean(token));

//     return res.status(200).json({
//       success: true,

//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         allowedSiteIds: user.allowedSiteIds || [],
//       },

//       tenant: {
//         id: tenant._id,
//         name: tenant.name,
//         slug: tenant.slug,
//         plan: tenant.plan,
//         timezone: tenant.timezone,
//         branding: tenant.branding,
//         limits: tenant.limits,
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// }

// export function getCurrentUser(req, res) {
//   return res.status(200).json({
//     success: true,
//     user: req.user,
//     tenant: req.tenant,
//   });
// }

// export function logout(req, res) {
//   clearAuthCookie(res);

//   return res.status(200).json({
//     success: true,
//     message: "Logged out successfully",
//   });
// }
