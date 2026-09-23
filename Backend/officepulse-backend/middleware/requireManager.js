// middleware/requireManager.js
// Checks that the logged-in user has "manager" role before allowing an action.
// Must run AFTER verifyToken, since it needs req.user.uid.

const { db } = require("../firebase");

async function requireManager(req, res, next) {
  try {
    const userDoc = await db.collection("users").doc(req.user.uid).get();

    if (!userDoc.exists || userDoc.data().role !== "manager") {
      return res.status(403).json({ error: "Manager access required" });
    }

    next();
  } catch (error) {
    console.error("Error checking manager role:", error);
    res.status(500).json({ error: "Something went wrong checking permissions" });
  }
}

module.exports = { requireManager };