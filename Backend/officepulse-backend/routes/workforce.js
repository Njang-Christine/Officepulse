// routes/workforce.js
const express = require("express");
const router = express.Router();
const { db } = require("../firebase");
const { verifyToken } = require("../middleware/auth");
const { requireManager } = require("../middleware/requireManager");

// GET /workforce/today - list everyone who checked in today, manager-only
router.get("/workforce/today", verifyToken, requireManager, async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const snapshot = await db.collection("checkins")
      .where("timestamp", ">=", startOfDay.toISOString())
      .where("timestamp", "<=", endOfDay.toISOString())
      .get();

    const presentToday = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const onTimeCount = presentToday.filter((c) => c.status === "on-time").length;
    const lateCount = presentToday.filter((c) => c.status === "late").length;

    res.status(200).json({
      date: startOfDay.toISOString().split("T")[0],
      totalPresent: presentToday.length,
      onTimeCount,
      lateCount,
      checkins: presentToday,
    });
  } catch (error) {
    console.error("Error fetching workforce data:", error);
    res.status(500).json({ error: "Something went wrong fetching workforce data" });
  }
});

module.exports = router;