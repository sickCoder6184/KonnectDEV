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
    if (!validateEditProfile(req)) {
      return res.status(400).send("Invalid Edit Request");
    }

    const loggedInUser = req.user;

    Object.keys(req.body).forEach(
      (field) => (loggedInUser[field] = req.body[field])
    );

    await loggedInUser.save();

    res.json({
      message: `${loggedInUser.firstName} your proifile is Updated`,
      data: loggedInUser,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to fetch profile",
      details: formatValidationErrors(err),
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
