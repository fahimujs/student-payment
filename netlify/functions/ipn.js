const admin = require("firebase-admin");

function initFirebase() {
  if (admin.apps.length) return true;
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
    return true;
  } catch (e) {
    console.error("[IPN-FB] Init error:", e.message);
    return false;
  }
}

exports.handler = async (event) => {
  console.log("[IPN] Body:", event.body);

  let data;
  try { data = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: "Invalid JSON" }; }

  const status = (data.status || "").toUpperCase();

  if (status === "COMPLETED") {
    const fbOk = initFirebase();
    if (fbOk) {
      try {
        const meta = data.metadata || {};
        const record = {
          name: meta.name || data.full_name || "Unknown",
          roll: meta.roll || "Unknown",
          department: meta.department || "Unknown",
          amount: parseFloat(data.amount || 0),
          trxId: data.transaction_id || data.trx_id || "",
          invoiceId: data.invoice_id || "",
          paymentMethod: data.payment_method || "bKash",
          timestamp: new Date().toISOString(),
          status: "COMPLETED",
        };
        const safeKey = (data.invoice_id || Date.now().toString()).replace(/[.#$[\]]/g, "_");
        await admin.database().ref(`payments/${safeKey}`).set(record);
        console.log("[IPN] Saved to Firebase:", record);
      } catch (e) {
        console.error("[IPN] Firebase save error:", e.message);
      }
    }
  }

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
