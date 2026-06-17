// firebase/firebase-config.js
// Firebase Admin SDK initialization for backend use

const admin = require('firebase-admin');

// Parse service account from environment variable (JSON string)
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
} catch (e) {
  console.error('❌ Invalid FIREBASE_SERVICE_ACCOUNT_KEY in .env');
  process.exit(1);
}

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

// Realtime Database reference
const db = admin.database();

module.exports = { admin, db };
