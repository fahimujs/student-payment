const axios = require("axios");

const UDDOKTAPAY_BASE_URL = "https://shorifulislam.paymently.io/api";
const UDDOKTAPAY_API_KEY = "FM5AKGENbOXZxNgMn5ofpqmIi3rI0nNVFHaqHcfG";
const YOUR_SITE = "https://magenta-stardust-b22a2f.netlify.app";

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: "Method Not Allowed" };

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const { name, roll, amount, department } = body;

  if (!name || !roll || !amount || !department) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "All fields are required." }) };
  }

  const parsedAmount = parseInt(amount);

  // ✅ redirect_url = verify function — student data query param এ পাঠাচ্ছি
  const studentData = new URLSearchParams({ name, roll, department, amount: parsedAmount });
  const redirectUrl = `${YOUR_SITE}/.netlify/functions/verify-payment?${studentData.toString()}`;

  const payload = {
    full_name: name,
    email: `${roll.toLowerCase().replace(/\s/g, "")}@student.edu`,
    amount: parsedAmount,
    currency: "BDT",
    metadata: { name, roll, department },
    redirect_url: redirectUrl,
    cancel_url: `${YOUR_SITE}/cancel.html`,
    webhook_url: `${YOUR_SITE}/.netlify/functions/ipn`,
  };

  console.log("[CREATE] Payload:", JSON.stringify(payload));

  try {
    const response = await axios.post(
      `${UDDOKTAPAY_BASE_URL}/checkout-v2`,
      payload,
      {
        headers: {
          "RT-UDDOKTAPAY-API-KEY": UDDOKTAPAY_API_KEY,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    console.log("[CREATE] Response:", JSON.stringify(response.data));

    if (response.data && response.data.payment_url) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ payment_url: response.data.payment_url }),
      };
    }

    return { statusCode: 500, headers, body: JSON.stringify({ error: "No payment_url returned." }) };

  } catch (err) {
    console.error("[CREATE] Error:", err.response?.data || err.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Payment creation failed.", details: err.response?.data || err.message }),
    };
  }
};
