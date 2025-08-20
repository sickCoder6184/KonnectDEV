
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { formatValidationErrors } = require("../utils/validation");



const userAuth = async (req, res, next) => {
  try {
    // Extract token from cookies
    const { token } = req.cookies || {};

    if (!token) {
      return res.status(401).json({ error: "Authentication token missing" });
    }

    let decodedMsg;
    try {
      // Verify JWT token and decode user ID
      decodedMsg = jwt.verify(token, "Secret_key@123");
    } catch (jwtErr) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Fetch user from database using decoded ID
    const user = await User.findById(decodedMsg._id);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Attach user to request object for downstream middleware/routes
    req.user = user;
    next();
  } catch (err) {
    return res.status(400).json({
      error: "Failed to authenticate user",
      details: formatValidationErrors(err),
    });
  }
};

const softAuth = async (req, res, next) => {
  const { token } = req.cookies || {};

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decodedMsg = jwt.verify(token, "Secret_key@123");
    const user = await User.findById(decodedMsg._id);
    req.user = user || null;
  } catch {
    req.user = null;
  }

  next();
};

module.exports = { 
  userAuth,
  softAuth
};
