// adminAuth.js

// This is a middleware that checks if the request is from an admin.
// Middleware in Express takes (req, res, next).
const adminAuth = function adminAuth(req, res, next) {
    try {
        // Imagine we get a role from headers, token, or session
        const userRole = req.headers["role"]; 

        if (userRole === "admin") {
            // ✅ If role is admin, allow request to continue
            next();
        } else {
            // ❌ Block if not admin
            return res.status(403).json({ message: "Access denied. Admins only!" });
        }
    } catch (err) {
        // Handle unexpected errors (safe fallback)
        return res.status(500).json({ message: "Something went wrong!", error: err.message });
    }
};

module.exports={
    adminAuth:adminAuth,
}
