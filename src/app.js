const express = require("express");
const validator = require("validator");
const { connectDB } = require("./config/db");
const User = require("./models/user");

const app = express();
app.use(express.json());

/**
 * Utility function: format validation errors
 */
const formatValidationErrors = (err) => {
  if (err.name === "ValidationError") {
    return Object.keys(err.errors).map(
      (field) => `${field}: ${err.errors[field].message}`
    );
  }
  if (err.code === 11000) {
    return [
      `Duplicate value for field: ${Object.keys(err.keyValue).join(", ")}`,
    ];
  }
  return ["Something went wrong"];
};

/**
 * GET /email
 * Find user(s) by emailId
 */
app.get("/email", async (req, res) => {
  const { emailId } = req.body;

  // Validate email format before querying
  if (!emailId || !validator.isEmail(emailId)) {
    return res.status(400).json({ 
      error: "Invalid email format" 
    });
  }

  try {
    const users = await User.find({ emailId });
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(users);
  } catch (err) {
    res.status(400).json({
      error: "Failed to fetch user",
      details: formatValidationErrors(err),
    });
  }
});

/**
 * GET /feed
 * Fetch all users
 */
app.get("/feed", async (req, res) => {
  try {
    const users = await User.find({});
    if (users.length === 0) {
      return res.status(404).json({ error: "No users found" });
    }
    res.json(users);
  } catch (err) {
    res.status(400).json({
      error: "Failed to fetch users",
      details: formatValidationErrors(err),
    });
  }
});

/**
 * POST /signUp
 * Create a new user
 */
app.post("/signUp", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).send({ message: "✅ User added successfully!!", user });
  } catch (err) {
    console.log(err);

    res.status(400).json({
      error: "Validation failed",
      details: formatValidationErrors(err),
    });
  }
});

/**
 * DELETE /user
 * Delete user by ID
 */
app.delete("/user", async (req, res) => {
  const { userId } = req.body;

  // Validate MongoDB ObjectId format
  if (!userId || !validator.isMongoId(userId)) {
    return res.status(400).json({ 
      error: "Invalid user ID format" 
    });
  }

  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "🗑️ User deleted successfully!!!" });
  } catch (err) {
    res.status(400).json({
      error: "Failed to delete user",
      details: formatValidationErrors(err),
    });
  }
});

/**
 * PATCH /user/:userId
 * Update user details by ID
 */
app.patch("/user/:userId", async (req, res) => {
  const allowedUpdates = ["bio", "photo", "skills"];

  //  get userId from params
  const userId = req.params?.userId;

  // Validate MongoDB ObjectId format
  if (!userId || !validator.isMongoId(userId)) {
    return res.status(400).json({ 
      error: "Invalid user ID format" 
    });
  }

  // Extract update fields from body
  const { ...updateData } = req.body;
  const updates = Object.keys(updateData); // it contains fields in []

  // Check if all requested updates are valid
  const isValidOperation = updates.every((field) =>
    allowedUpdates.includes(field)
  );

  if (!isValidOperation) {
    return res.status(400).json({
      error: "Invalid updates",
      details: `Allowed fields to update: ${allowedUpdates.join(", ")}`,
    });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true, //  return updated doc
      runValidators: true, //  enforce schema validators
    });

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({
      error: "Validation failed",
      details: formatValidationErrors(err),
    });
  }
});

// DB + SERVER START
connectDB()
  .then(() => {
    console.log("✅ DB connection established...");
    app.listen(3000, () => {
      console.log("🚀 Server running on http://localhost:3000");
    });
  })
  .catch((err) => {
    console.error("❌ DB not connected!!!!", err);
  });