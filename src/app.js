const express = require("express");
const { connectDB } = require("./config/db");
const User = require("./models/user");

const app = express();

connectDB()
  .then(() => {
    console.log("DB connection established....");
    app.listen(3000, () => {
      console.log("Server running on http://localhost:3000");
    });
  })
  .catch((err) => {
    console.error("DB not Connected!!!!");
  });

app.post("/signUp", async (req, res) => {
  const userObj = {
    firstName: "Preyanshu",
    lastName: "Dhapola",
    
    gender: "male",
  };

  const user = new User(userObj);

  try {
    await user.save();
  res.send("User Added SuccessFully!!");
  } catch (error) {
    res.status(404).send("Caught err while saviing User Data",error);
    
  }

  
});
