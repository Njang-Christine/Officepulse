// middleware/auth.js
// Checks that a request has a valid Firebase login token before letting it through.
// If valid, it trusts req.user.uid as the real, verified user ID -
// no more relying on a userId typed freely in the request body.

const { admin } = require("../firebase");

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization; // expects "Bearer <token>"

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No authentication token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded; // now req.user.uid is the trusted, real user ID
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { verifyToken };