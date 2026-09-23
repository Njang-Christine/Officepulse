// routes/pto.js
const {requireOwnerOrManager} = require("../middleware/requireOwnerOrManager");
const express = require("express");
const router = express.Router();
const { db } = require("../firebase");
const { verifyToken } = require("../middleware/auth");
const { requireManager } = require("../middleware/requireManager");

// POST /pto - submit a leave request
router.post("/pto", verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { startDate, endDate, reason } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate are required" });
    }

    const ptoData = {
      userId,
      startDate,
      endDate,
      reason: reason || "",
      status: "pending",
      requestedAt: new Date().toISOString(),
    };

    const docRef = await db.collection("pto_requests").add(ptoData);

    res.status(201).json({ message: "PTO request submitted", id: docRef.id, ...ptoData });
  } catch (error) {
    console.error("Error saving PTO request:", error);
    res.status(500).json({ error: "Something went wrong submitting the PTO request" });
  }
});

// GET /pto/calendar?startDate=2026-11-01&endDate=2026-11-30
// Manager-only: shows everyone approved to be out during the given range
router.get("/pto/calendar", verifyToken, requireManager, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate query params are required" });
    }

    const rangeStart = new Date(startDate);
    const rangeEnd = new Date(endDate);

    // Fetch all approved requests, then filter for date overlap in code
    // (Firestore can't easily query "date ranges that overlap" directly)
    const snapshot = await db.collection("pto_requests")
      .where("status", "==", "approved")
      .get();

    const allApproved = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const inRange = allApproved.filter((req) => {
      const reqStart = new Date(req.startDate);
      const reqEnd = new Date(req.endDate);
      // Overlap check: request overlaps the range if it starts before range ends
      // AND ends after range starts
      return reqStart <= rangeEnd && reqEnd >= rangeStart;
    });

    res.status(200).json({
      rangeStart: startDate,
      rangeEnd: endDate,
      totalOnLeave: inRange.length,
      leave: inRange,
    });
  } catch (error) {
    console.error("Error fetching PTO calendar:", error);
    res.status(500).json({ error: "Something went wrong fetching the PTO calendar" });
  }
});

// GET /pto/:userId - view a user's PTO requests
router.get("/pto/:userId", verifyToken, requireOwnerOrManager, async (req, res) => {
  try {
    const { userId } = req.params;

    const snapshot = await db.collection("pto_requests")
      .where("userId", "==", userId)
      .orderBy("requestedAt", "desc")
      .get();

    const requests = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching PTO requests:", error);
    res.status(500).json({ error: "Something went wrong fetching PTO requests" });
  }
});

// PATCH /pto/:id/status - approve or deny a PTO request
router.patch("/pto/:id/status", verifyToken, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "denied"].includes(status)) {
      return res.status(400).json({ error: "status must be 'approved' or 'denied'" });
    }

    const docRef = db.collection("pto_requests").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "PTO request not found" });
    }

    const requestData = doc.data();

    if (status === "approved") {
      const start = new Date(requestData.startDate);
      const end = new Date(requestData.endDate);
      const daysRequested = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;

      const userRef = db.collection("users").doc(requestData.userId);
      const userDoc = await userRef.get();
      const currentBalance = userDoc.exists ? (userDoc.data().ptoBalance ?? 0) : 0;

      if (daysRequested > currentBalance) {
        return res.status(400).json({
          error: "Insufficient PTO balance",
          daysRequested,
          currentBalance,
        });
      }

      await userRef.update({ ptoBalance: currentBalance - daysRequested });
      await docRef.update({
        status,
        daysRequested,
        reviewedAt: new Date().toISOString(),
        reviewedBy: req.user.uid,
      });

      return res.status(200).json({
        message: "PTO request approved",
        id,
        status,
        daysRequested,
        remainingBalance: currentBalance - daysRequested,
      });
    }

    await docRef.update({
      status,
      reviewedAt: new Date().toISOString(),
      reviewedBy: req.user.uid,
    });

    res.status(200).json({ message: `PTO request ${status}`, id, status });
  } catch (error) {
    console.error("Error updating PTO status:", error);
    res.status(500).json({ error: "Something went wrong updating the PTO request" });
  }
});

// GET /pto/balance/:userId
router.get("/pto/balance/:userId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      userId,
      ptoBalance: userDoc.data().ptoBalance ?? 0,
    });
  } catch (error) {
    console.error("Error fetching PTO balance:", error);
    res.status(500).json({ error: "Something went wrong fetching PTO balance" });
  }
});

module.exports = router;