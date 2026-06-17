const admin = require("firebase-admin");

exports.handler = async (event) => {
  const headers = { "Content-Type": "application/json" };

  // Step 1: ENV check
  const fbKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const fbUrl = process.env.FIREBASE_DATABASE_URL;

  if (!fbKey) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        error: "FIREBASE_SERVICE_ACCOUNT_KEY is MISSING in Netlify env vars" 
      }),
    };
  }

  if (!fbUrl) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        error: "FIREBASE_DATABASE_URL is MISSING in Netlify env vars" 
      }),
    };
  }

  // Step 2: Parse JSON
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(fbKey);
  } catch (e) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        error: "FIREBASE_SERVICE_ACCOUNT_KEY is invalid JSON: " + e.message,
        keyLength: fbKey.length,
        keyStart: fbKey.substring(0, 50)
      }),
    };
  }

  // Step 3: Firebase init
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: fbUrl,
      });
    }
  } catch (e) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ error: "Firebase init failed: " + e.message }),
    };
  }

  // Step 4: Write test data
  try {
    await admin.database().ref("test/connection").set({
      message: "Firebase connected!",
      time: new Date().toISOString(),
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: "Firebase write successful! Check your database.",
        databaseUrl: fbUrl
      }),
    };
  } catch (e) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ error: "Firebase write failed: " + e.message }),
    };
  }
};
