const mongoose = require("mongoose");
require("dotenv").config(); // load .env variables

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ DB Connection Failed:", err.message);
    process.exit(1); // stop the app if DB doesn’t connect
  }
};

module.exports = { connectDB };
