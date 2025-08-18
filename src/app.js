const express = require("express");
const bcrypt = require("bcrypt");
const validator = require("validator");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const { userAuth } = require("./middleware/auth");
const { connectDB } = require("./config/db");
const { formatValidationErrors, validateEmail } = require("./utils/validation");
const User = require("./models/user");

const app = express();

// Middleware setup
app.use(express.json());
app.use(cookieParser());

// POST [/signUp] ----- Create a new user account Body: { firstName, lastName, emailId, password, age, gender }
app.post("/signUp", async (req, res) => {
  try {
    const { firstName, lastName, emailId, password, age, gender } = req.body;

    // Validate email format
    if (!emailId || !validator.isEmail(emailId)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate password presence
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ emailId });
    if (existingUser) {
      return res.status(409).json({ error: "Email already in use" });
    }

    // Hash the password for security
    const passwordHash = await bcrypt.hash(password, 10);

    // Create new user instance
    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
      age,
      gender,
    });

    // Save user to database
    await user.save();

    // Remove password from response for security
    const userResponse = user.toObject();
    delete userResponse.password;

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

//POST [/login] ------ Authenticate user and create session Body: { loggedEmail, password }
app.post("/login", async (req, res) => {
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
    const token = user.gwtJWT();

    // Set token
    res.cookie("token", token, { expires: new Date(Date.now() + 8 * 3600000) });

    return res.json({ message: "Login successful" });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({
      error: "Login failed",
      details: formatValidationErrors(err),
    });
  }
});

// GET [/profile] ----- Get authenticated user's profile Requires: Valid JWT token in cookies
app.get("/profile", userAuth, async (req, res) => {
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
    console.error("Profile Fetch Error:", err);
    return res.status(500).json({
      error: "Failed to fetch profile",
      details: formatValidationErrors(err),
    });
  }
});

// Database connection and server startup
connectDB()
  .then(() => {
    console.log("✅ Database connection established");
    app.listen(3000, () => {
      console.log("🚀 Server running on http://localhost:3000");
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  });
