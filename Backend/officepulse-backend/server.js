// server.js
// This is the entry point of our backend. It starts the web server
// and connects our routes (like /checkin) to it.

const complianceRoutes = require("./routes/compliance");
const workforceRoutes = require("./routes/workforce");
const express = require("express");
const cors = require("cors");

const checkinRoutes = require("./routes/checkin");
const ptoRoutes = require("./routes/pto");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // allows the frontend (running on a different address) to talk to this backend
app.use(express.json()); // lets us read JSON data sent in requests

// A simple test route - visit this in your browser to check the server is running
app.get("/", (req, res) => {
  res.send("OfficePulse backend is running ✅");
});

// Hook up our check-in routes
app.use("/", checkinRoutes);
app.use("/", ptoRoutes);
app.use("/", workforceRoutes);
app.use("/", complianceRoutes);

app.listen(PORT, () => {
  console.log(`🚀 OfficePulse backend running at http://localhost:${PORT}`);
});
