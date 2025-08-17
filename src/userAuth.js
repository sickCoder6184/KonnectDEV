// userAuth.js

// Middleware to protect all user routes, but skip /user/login
const userAuth = function userAuth(req, res, next) {
    try {
        // Skip auth check for login route
        if (req.path === "/login") {
            return next();
        }

        // Dummy check: Assume we check a token in headers
        const token = req.headers["authorization"];

        if (!token) {
            return res.status(401).json({ message: "Unauthorized. Please login first!" });
        }

        // ✅ If token exists, allow the request
        next();

    } catch (err) {
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
};

module.exports={
    userAuth:userAuth
}
