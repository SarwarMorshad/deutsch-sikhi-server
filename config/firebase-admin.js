const admin = require("firebase-admin");
const path = require("path");

// Path to your service account key file
const serviceAccountPath = path.join(__dirname, "..", "firebase-admin-key.json");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath),
});

module.exports = admin;
