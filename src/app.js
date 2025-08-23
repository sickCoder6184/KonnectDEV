const express = require("express");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./config/db");
const http=require("http")

const cors = require('cors')

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
const initializeSocket = require("./utils/socket");
const chatRouter = require("./routes/chats");

app.use("/",authRouter)
app.use("/",profileRouter)
app.use("/",requestRouter)
app.use("/",userRouter)
app.use("/",chatRouter)

const server=http.createServer(app) //created server using http
initializeSocket(server) // initialize a socket using server(socket)


// Database connection and server startup
connectDB()
  .then(() => {
    console.log("✅ Database connection established");
    server.listen(process.env.PORT, () => { // changed (app -> server)
      console.log("🚀 Server running on http://localhost:3000");
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  });
