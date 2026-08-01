import mongoose from "mongoose";

export function validateObjectId(parameterName) {
  return function objectIdValidationMiddleware(req, res, next) {
    if (!mongoose.isValidObjectId(req.params[parameterName])) {
      return res.status(400).json({
        success: false,
        error: `Invalid ${parameterName}`,
      });
    }

    next();
  };
}
