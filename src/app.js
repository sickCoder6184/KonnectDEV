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
    const users = await User.find({ emailId: getUserEmail });

    if (users.length === 0) {
      return res.status(404).send("User not Found");
    }

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(400).send("Something Went Wrong!!");
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

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(400).send("Something Went Wrong!!");
  }
});

/**
 * POST /signUp
 * Creates a new user and saves to DB
 */
app.post("/signUp", async (req, res) => {
  const user = new User(req.body);

  try {
    await user.save();
    res.send("User Added Successfully!!");
  } catch (error) {
    console.error(error);
    res.status(400).send("Error while saving User Data");
  }
});

/**
 * DELETE /user
 * Delete a user by ID
 */
app.delete("/user", async (req, res) => {
  const getUserId = req.body.userId; // Grab userId from request body

  try {
    const user = await User.findByIdAndDelete(getUserId);

    if (!user) {
      return res.status(404).send("User not found");
    }

    res.send("User deleted successfully!!!");
  } catch (err) {
    console.error(err);
    res.status(400).send("Something Went Wrong");
  }
});

/**
 * PATCH /user
 * Update user details by ID
 */
app.patch("/user", async (req, res) => {
  const getUserId = req.body.userId; // Grab userId from request body
  const updateData = req.body; // Fields to update

  try {
    const updatedUser = await User.findByIdAndUpdate(
      getUserId,
      updateData,
      { new: true } // return updated document
    );

    if (!updatedUser) {
      return res.status(404).send("User not found");
    }

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(400).send("Something Went Wrong");
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
