import jwt from "jsonwebtoken";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "ruhanex_session";

export function createAccessToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      tenantId: user.tenantId.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "8h",
      issuer: "ruhanex-iot",
      audience: "ruhanex-dashboard",
    }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: "ruhanex-iot",
    audience: "ruhanex-dashboard",
  });
}

export function setAuthCookie(res, token) {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res) {
  const isProduction = process.env.NODE_ENV === "production";

  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });
}

export function getAuthCookieName() {
  return COOKIE_NAME;
}
