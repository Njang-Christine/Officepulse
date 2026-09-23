// routes/compliance.js
const express = require("express");
const router = express.Router();
const { db } = require("../firebase");
const { verifyToken } = require("../middleware/auth");
const { requireManager } = require("../middleware/requireManager");

// How many late arrivals in the period before flagging someone as "at risk"
const LATE_THRESHOLD = 3;

// GET /compliance - company-wide compliance summary for the current month, manager-only
router.get("/compliance", verifyToken, requireManager, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const snapshot = await db.collection("checkins")
      .where("timestamp", ">=", startOfMonth.toISOString())
      .get();

    const records = snapshot.docs.map((doc) => doc.data());

    // Group by user
    const byUser = {};
    for (const record of records) {
      if (!byUser[record.userId]) {
        byUser[record.userId] = { userId: record.userId, totalCheckins: 0, lateCount: 0, onTimeCount: 0 };
      }
      byUser[record.userId].totalCheckins++;
      if (record.status === "late") byUser[record.userId].lateCount++;
      if (record.status === "on-time") byUser[record.userId].onTimeCount++;
    }

    const userSummaries = Object.values(byUser).map((u) => ({
      ...u,
      atRisk: u.lateCount >= LATE_THRESHOLD,
    }));

    const totalLate = records.filter((r) => r.status === "late").length;
    const totalOnTime = records.filter((r) => r.status === "on-time").length;
    const usersAtRisk = userSummaries.filter((u) => u.atRisk).length;

    res.status(200).json({
      periodStart: startOfMonth.toISOString().split("T")[0],
      totalCheckins: records.length,
      totalOnTime,
      totalLate,
      usersAtRisk,
      lateThreshold: LATE_THRESHOLD,
      users: userSummaries,
    });
  } catch (error) {
    console.error("Error fetching compliance data:", error);
    res.status(500).json({ error: "Something went wrong fetching compliance data" });
  }
});

module.exports = router;