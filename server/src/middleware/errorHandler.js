export function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(error, req, res, next) {
  console.error(error);

  if (error?.code === 11000) {
    return res.status(409).json({
      success: false,
      error: "A record with these details already exists",
    });
  }

  if (error?.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: Object.values(error.errors)
        .map((item) => item.message)
        .join(", "),
    });
  }

  return res.status(error.statusCode || 500).json({
    success: false,
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message || "Internal server error",
  });
}
