// middleware/requireOwnerOrManager.js
// Allows access if the logged-in user is viewing their OWN data,
// or if they are a manager (who can view anyone's data).
// Expects the target user's ID to be in req.params.userId.

const { db } = require("../firebase");

async function requireOwnerOrManager(req, res, next) {
  try {
    const requestedUserId = req.params.userId;

    if (req.user.uid === requestedUserId) {
      return next();
    }

    const userDoc = await db.collection("users").doc(req.user.uid).get();
    if (userDoc.exists && userDoc.data().role === "manager") {
      return next();
    }

    return res.status(403).json({ error: "You do not have permission to view this data" });
  } catch (error) {
    console.error("Error checking access permission:", error);
    res.status(500).json({ error: "Something went wrong checking permissions" });
  }
}

module.exports = { requireOwnerOrManager };