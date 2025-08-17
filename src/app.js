const express = require("express");
const { connectDB } = require("./config/db");
const User = require("./models/user");

const app = express();

// Middleware to parse incoming JSON requests
app.use(express.json());

/**
 * GET /email
 * Finds a user (or users) by their email address
 */
app.get("/email", async (req, res) => {
  const getUserEmail = req.body.emailId; // Grab emailId from request body

  try {
    // Find users with given emailId
    const users = await User.find({ emailId: getUserEmail });

    if (users.length === 0) {
      return res.status(404).send("User not Found");
    }

    res.json(users); // Send user(s) as JSON
  } catch (error) {
    res.status(400).send("Something Went Wrong!!");
    console.error(error);
  }
});

/**
 * GET /feed
 * Returns all users in DB
 */
app.get("/feed", async (req, res) => {
  try {
    const users = await User.find({});

    if (users.length === 0) {
      return res.status(404).send("No Users Found");
    }

    res.send(users);
  } catch (error) {
    res.status(400).send("Something Went Wrong!!");
    console.error(error);
  }
});

/**
 * POST /signUp
 * Creates a new user and saves to DB
 */
app.post("/signUp", async (req, res) => {
  // Create new user instance
  const user = new User(req.body);

  try {
    await user.save(); // Save to DB
    res.send("User Added Successfully!!");
  } catch (error) {
    res.status(400).send("Error while saving User Data");
    console.error(error);
  }
});

/**
 * Connect to MongoDB first, then start server
 */
connectDB()
  .then(() => {
    console.log("✅ DB connection established....");
    app.listen(3000, () => {
      console.log("🚀 Server running on http://localhost:3000");
    });
  })
  .catch((err) => {
    console.error("❌ DB not Connected!!!!", err);
  });

