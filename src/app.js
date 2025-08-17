const express = require("express");
const app = express();

const {adminAuth} = require("./adminAuth");
const {userAuth} = require("./userAuth");

// ---------- Admin Routes ----------
app.use("/admin", adminAuth); // All /admin/* routes protected

app.get("/admin/dashboard", (req, res) => {
    res.send("Welcome Admin Dashboard");
});

app.get("/admin/blocked", (req, res) => {
    res.send("Blocked by Admin");
});

app.get("/admin/fav", (req, res) => {
    res.send("faviourate by Admin");
});
// ---------- User Routes ----------
app.use("/user", userAuth); // Protect all user routes except /user/login

app.get("/user/login", (req, res) => {
    res.send("User plzz logge in!!!");
});

app.get("/user/profile", (req, res) => {
    res.send("User profile accessed successfully!");
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
