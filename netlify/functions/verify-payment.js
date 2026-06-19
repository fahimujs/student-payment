const axios = require("axios");
const admin = require("firebase-admin");

const UDDOKTAPAY_BASE_URL = "https://epay.corp.com.bd/pay.php";
const UDDOKTAPAY_API_KEY = "5a4aa89f6f00267e18df124f2ca8e347202a2b0eb2b812682a6109eac4c8177e";
const YOUR_SITE = "https://my-payment-web.netlify.app";

// Firebase init
function initFirebase() {
  if (admin.apps.length) return true;
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!raw) { console.error("[FB] FIREBASE_SERVICE_ACCOUNT_KEY missing"); return false; }
    const serviceAccount = JSON.parse(raw);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
    console.log("[FB] Initialized OK");
    return true;
  } catch (e) {
    console.error("[FB] Init error:", e.message);
    return false;
  }
}

exports.handler = async (event) => {
  const params = event.queryStringParameters || {};
  console.log("[VERIFY] Incoming params:", JSON.stringify(params));

  // UddoktaPay এর পাঠানো invoice_id
  const invoiceId = params.invoice_id;
  const name = params.name || "Unknown";
  const roll = params.roll || "Unknown";
  const department = params.department || "Unknown";
  const amount = params.amount || "0";

  if (!invoiceId) {
    console.log("[VERIFY] No invoice_id — redirecting to cancel");
    return {
      statusCode: 302,
      headers: { Location: `${YOUR_SITE}/cancel.html?reason=missing_invoice` },
      body: "",
    };
  }

  try {
    // ── Step 1: UddoktaPay verify ──
    console.log("[VERIFY] Verifying invoice:", invoiceId);
    const verifyRes = await axios.post(
      `${UDDOKTAPAY_BASE_URL}/verify-payment`,
      { invoice_id: invoiceId },
      {
        headers: {
          "RT-UDDOKTAPAY-API-KEY": UDDOKTAPAY_API_KEY,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    const data = verifyRes.data;
    console.log("[VERIFY] Gateway response:", JSON.stringify(data));

    // ── Step 2: Status check ──
    const status = (data.status || "").toUpperCase();
    const paramStatus = (params.status || "").toUpperCase();
    const isCompleted = status === "COMPLETED" || paramStatus === "COMPLETED";

    if (!isCompleted) {
      console.log("[VERIFY] Not completed. status:", status, "param status:", paramStatus);
      return {
        statusCode: 302,
        headers: { Location: `${YOUR_SITE}/cancel.html?reason=not_completed` },
        body: "",
      };
    }

    // ── Step 3: Firebase save ──
    const fbOk = initFirebase();
    if (fbOk) {
      const record = {
        name: name,
        roll: roll,
        department: department,
        amount: parseFloat(data.amount || amount),
        trxId: data.transaction_id || data.trx_id || invoiceId,
        invoiceId: invoiceId,
        paymentMethod: data.payment_method || "bKash",
        timestamp: new Date().toISOString(),
        status: "COMPLETED",
      };

      const safeKey = invoiceId.replace(/[.#$[\]]/g, "_");
      await admin.database().ref(`payments/${safeKey}`).set(record);
      console.log("[FB] Saved:", JSON.stringify(record));

      // ── Step 4: Success page এ redirect ──
      const sp = new URLSearchParams({
        trxId: record.trxId,
        amount: record.amount,
        name: record.name,
        roll: record.roll,
        department: record.department,
      });

      return {
        statusCode: 302,
        headers: { Location: `${YOUR_SITE}/success.html?${sp.toString()}` },
        body: "",
      };
    } else {
      // Firebase fail হলেও success দেখাও
      return {
        statusCode: 302,
        headers: { Location: `${YOUR_SITE}/success.html?trxId=${invoiceId}&amount=${amount}&name=${name}&roll=${roll}&department=${department}` },
        body: "",
      };
    }

  } catch (err) {
    console.error("[VERIFY] Error:", err.response?.data || err.message);
    return {
      statusCode: 302,
      headers: { Location: `${YOUR_SITE}/cancel.html?reason=verify_error` },
      body: "",
    };
  }
};
