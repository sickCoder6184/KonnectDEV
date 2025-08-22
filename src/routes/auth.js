const express=require("express");
const authRouter=express.Router();

const validator = require("validator");
const bcrypt = require("bcrypt");

const { softAuth } = require("../middleware/auth");
const User = require("../models/user");
const { formatValidationErrors, validateSignupPassword } = require("../utils/validation");


authRouter.post("/signUp", async (req, res) => {
  try {
    const { firstName, lastName, emailId, password, age, gender, photo, bio, skills } = req.body;

    // Validate email
    if (!emailId || !validator.isEmail(emailId)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate password using helper
    const { valid, message } = validateSignupPassword(password);
    if (!valid) {
      return res.status(400).json({ error: message });
    }

    // Check if user exists
    const existingUser = await User.findOne({ emailId });
    if (existingUser) {
      return res.status(409).json({ error: "Email already in use" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with ALL fields
    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
      age,
      gender,
      photo,   
      bio,     
      skills   
    });

    await user.save();

    const userResponse = user.toObject();

    
    res.status(201).json({
      message: "✅ User registered successfully!",
      user: userResponse,
    });
  } catch (err) {
    console.error("SignUp Error:", err);
    res.status(400).json({
      error: "Registration failed",
      details: formatValidationErrors(err),
    });
  }
});


authRouter.post("/login", async (req, res) => {
  try {
    // Extract login credentials
    const { password, loggedEmail } = req.body;

    // Validate email format
    if (!loggedEmail || !validator.isEmail(loggedEmail)) {
      return res.status(400).json({
        error: "Validation failed",
        details: ["Invalid email format"],
      });
    }

    // Validate password presence
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    // Fetched user by email
    const user = await User.findOne({ emailId: loggedEmail });

    //Validating user
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Verify password (validatePassword) ==== schemA
    const isValidPassword = await user.validatePassword(password)
    if (!isValidPassword) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate JWT token with user ID
    const token = user.getJWT();

    
    // Set token
    res.cookie("token", token, { expires: new Date(Date.now() + 8 * 3600000) });

    return res.json({ message: "Login successful" ,
      data:user
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({
      error: "Login failed",
      details: formatValidationErrors(err),
    });
  }
});


authRouter.post("/logout", softAuth, (req, res) => {

  //clearing out cookie
  res.clearCookie("token");

  if (req.user) {
    return res.json({ message: `${req.user.firstName} logged out successfully` });
  }

  return res.json({ message: "You already logged out" });
});


module.exports=authRouter;