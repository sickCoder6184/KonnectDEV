const express = require("express");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./config/db");
var cors = require('cors')
 const app = express();

 require("dotenv").config()
// Middleware setup

//WhiteListing The Origin
app.use(cors({
  origin:"http://localhost:5173",
  credentials:true,
}))
app.use(express.json());
app.use(cookieParser());


const authRouter=require("./routes/auth");
const profileRouter = require('./routes/profile');
const requestRouter=require("./routes/requests");
const userRouter = require("./routes/user");

app.use("/",authRouter)
app.use("/",profileRouter)
app.use("/",requestRouter)
app.use("/",userRouter)

// Database connection and server startup
connectDB()
  .then(() => {
    console.log("✅ Database connection established");
    app.listen(process.env.PORT, () => {
      console.log("🚀 Server running on http://localhost:3000");
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  });
