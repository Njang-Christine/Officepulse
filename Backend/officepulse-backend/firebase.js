// firebase.js
// This file connects our backend to Firebase using the service account key
// you downloaded from Firebase console (Project settings -> Service accounts).

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// Look for the service account key file in the project root.
// IMPORTANT: rename the file you downloaded to exactly this name:
//   serviceAccountKey.json
// and place it in the same folder as this file (the project root).
const keyPath = path.join(__dirname, "serviceAccountKey.json");

if (!fs.existsSync(keyPath)) {
  console.error(
    "\n❌ Missing serviceAccountKey.json.\n" +
    "Download it from Firebase console -> Project settings -> Service accounts -> Generate new private key,\n" +
    "then rename the downloaded file to 'serviceAccountKey.json' and put it in this project's root folder.\n"
  );
  process.exit(1);
}

const serviceAccount = require(keyPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Firestore database reference - we'll use this everywhere else in the app
const db = admin.firestore();

module.exports = { admin, db };
