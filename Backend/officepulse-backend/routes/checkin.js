// routes/checkin.js
const { requireOwnerOrManager } = require("../middleware/requireOwnerOrManager");
const express = require("express");
const router = express.Router();
const { db } = require("../firebase");
const { getDistanceInMeters } = require("../utils/location");
const { verifyToken } = require("../middleware/auth");

const OFFICE_LATITUDE = 5.835;
const OFFICE_LONGITUDE = 9.855;
const ALLOWED_RADIUS_METERS = 500;

// Work start time and grace period - adjust these later to match Bauhaven's real hours
const WORK_START_HOUR = 9; // 9 AM
const WORK_START_MINUTE = 0;
const GRACE_PERIOD_MINUTES = 15;

function getAttendanceStatus(checkinTime) {
  const workStart = new Date(checkinTime);
  workStart.setHours(WORK_START_HOUR, WORK_START_MINUTE, 0, 0);

  const graceDeadline = new Date(workStart.getTime() + GRACE_PERIOD_MINUTES * 60000);

  return checkinTime <= graceDeadline ? "on-time" : "late";
}

router.post("/checkin", verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { latitude, longitude } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "latitude and longitude are required" });
    }

    const distance = getDistanceInMeters(latitude, longitude, OFFICE_LATITUDE, OFFICE_LONGITUDE);

    if (distance > ALLOWED_RADIUS_METERS) {
      return res.status(403).json({
        error: "You must be at the office to check in",
        distanceMeters: Math.round(distance),
      });
    }

    const now = new Date();
    const status = getAttendanceStatus(now);

    const checkinData = {
      userId,
      timestamp: now.toISOString(),
      latitude,
      longitude,
      status, // "on-time" or "late"
    };

    const docRef = await db.collection("checkins").add(checkinData);

    res.status(201).json({ message: "Check-in saved successfully", id: docRef.id, ...checkinData });
  } catch (error) {
    console.error("Error saving check-in:", error);
    res.status(500).json({ error: "Something went wrong saving the check-in" });
  }
});

router.get("/checkins/:userId", verifyToken, requireOwnerOrManager, async (req, res) => {
  try {
    const { userId } = req.params;

    const snapshot = await db.collection("checkins")
      .where("userId", "==", userId)
      .orderBy("timestamp", "desc")
      .get();

    const checkins = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(checkins);
  } catch (error) {
    console.error("Error fetching check-ins:", error);
    res.status(500).json({ error: "Something went wrong fetching check-ins" });
  }
});

// POST /checkout - closes out today's most recent check-in with a checkout time
router.post("/checkout", verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;

    // Find this user's most recent check-in that doesn't have a checkout yet
    const snapshot = await db.collection("checkins")
      .where("userId", "==", userId)
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "No check-in found to close out" });
    }

    const checkinDoc = snapshot.docs[0];
    const checkinData = checkinDoc.data();

    if (checkinData.checkoutTime) {
      return res.status(400).json({ error: "This check-in has already been checked out" });
    }

    const checkinTime = new Date(checkinData.timestamp);
    const checkoutTime = new Date();
    const hoursWorked = (checkoutTime - checkinTime) / (1000 * 60 * 60); // ms to hours

    await checkinDoc.ref.update({
      checkoutTime: checkoutTime.toISOString(),
      hoursWorked: Math.round(hoursWorked * 100) / 100, // rounded to 2 decimals
    });

    res.status(200).json({
      message: "Checked out successfully",
      id: checkinDoc.id,
      checkinTime: checkinData.timestamp,
      checkoutTime: checkoutTime.toISOString(),
      hoursWorked: Math.round(hoursWorked * 100) / 100,
    });
  } catch (error) {
    console.error("Error processing checkout:", error);
    res.status(500).json({ error: "Something went wrong processing the checkout" });
  }
});

// GET /time-tracking/:userId - summary of hours worked over a date range
router.get("/time-tracking/:userId", verifyToken, requireOwnerOrManager, async (req, res) => {
  try {
    const { userId } = req.params;

    const snapshot = await db.collection("checkins")
      .where("userId", "==", userId)
      .orderBy("timestamp", "desc")
      .get();

    const records = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const totalHours = records.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);
    const daysWithCheckout = records.filter((r) => r.hoursWorked !== undefined).length;
    const overtimeDays = records.filter((r) => r.hoursWorked && r.hoursWorked > 8).length;

    res.status(200).json({
      userId,
      totalRecords: records.length,
      daysWithCheckout,
      totalHoursWorked: Math.round(totalHours * 100) / 100,
      overtimeDays,
      records,
    });
  } catch (error) {
    console.error("Error fetching time tracking data:", error);
    res.status(500).json({ error: "Something went wrong fetching time tracking data" });
  }
});

module.exports = router;