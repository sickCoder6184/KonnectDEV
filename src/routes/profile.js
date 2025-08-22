const express = require("express");
const profileRouter = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/user");


const { userAuth } = require("../middleware/auth");

const {
  formatValidationErrors,
  validatePasswordField,
  validateEditProfile,
} = require("../utils/validation");

profileRouter.get("/profile", userAuth, async (req, res) => {
  try {
    // User is attached to req by userAuth middleware
    const user = req.user;

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Remove password from response for security
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.json(userResponse);
  } catch (err) {
    return res.status(500).json({
      error: "Failed to fetch profile",
      details: formatValidationErrors(err),
    });
  }
});

profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    // Validate request
    if (!validateEditProfile(req)) {
      return res.status(400).json({ message: "Invalid Edit Request" });
    }

    const loggedInUser = req.user;

    // Validate required fields
    const { firstName, lastName, age, gender } = req.body;
    
    if (!firstName?.trim()) {
      return res.status(400).json({ message: "First name is required" });
    }
    if (!lastName?.trim()) {
      return res.status(400).json({ message: "Last name is required" });
    }
    if (!age || age < 18 || age > 60) {
      return res.status(400).json({ message: "Age must be between 18-60" });
    }
    if (!gender || !["male", "female", "others"].includes(gender)) {
      return res.status(400).json({ message: "Valid gender is required" });
    }

    // Update fields
    Object.keys(req.body).forEach((field) => {
      loggedInUser[field] = req.body[field];
    });

    // Save user
    await loggedInUser.save();

    res.json({
      message: `${loggedInUser.firstName} your profile is updated`,
      data: loggedInUser,
    });

  } catch (err) {
    console.error("Profile update error:", err);
    return res.status(500).json({
      message: "Failed to update profile",
      error: err.message
    });
  }
});


profileRouter.patch("/profile/update-password", userAuth, async (req, res) => {
  try {
    //  validate input
    const { valid, message } = validatePasswordField(req);
    if (!valid) return res.status(400).json({ error: message });

    //  if valid (-then-) hash password
    const hashedPassword = await bcrypt.hash(req.body.newPassword, 10); 

    //  Get loggedin user 
    const loggedInUser=req.user;

    //update the password
    loggedInUser.password = hashedPassword;
    await loggedInUser.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update password" });
  }
});


module.exports = profileRouter;
