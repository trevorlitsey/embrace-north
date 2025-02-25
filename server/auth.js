const jwt = require("jsonwebtoken");

// Middleware to verify the JWT and extract userId
exports.authenticateJWT = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Assuming Bearer token

  if (!token) {
    return res.status(401).json({ message: "Authorization token is required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    // Attach userId to request object
    req.userId = user.id;
    next();
  });
};
