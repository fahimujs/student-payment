// public/js/main.js
// Shared utility functions for Student Payment System

// ── Firebase Client Config ────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyC2CVm57dXE35XSogbX-YSGxIJy46KaA0c",
  authDomain: "student-verify.firebaseapp.com",
  projectId: "student-verify",
  storageBucket: "student-verify.firebasestorage.app",
  messagingSenderId: "165426055484",
  appId: "1:165426055484:web:0ac70c2cc1781995543639",
  databaseURL: "https://student-verify-default-rtdb.firebaseio.com"
};

// ── UI Helpers ────────────────────────────────────────────────────────────────

/** Show an alert element with a message */
function showAlert(elementId, message, type = 'danger') {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.className = `alert alert-${type} show`;
  el.textContent = message;
}

/** Hide an alert element */
function hideAlert(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.className = 'alert';
}

/** Show loading spinner overlay */
function showLoading(message = 'Processing...') {
  const overlay = document.getElementById('spinner-overlay');
  const msg = document.getElementById('spinner-msg');
  if (overlay) overlay.classList.add('show');
  if (msg) msg.textContent = message;
}

/** Hide loading spinner overlay */
function hideLoading() {
  const overlay = document.getElementById('spinner-overlay');
  if (overlay) overlay.classList.remove('show');
}

// ── Date Formatting ───────────────────────────────────────────────────────────

/** Format ISO timestamp to readable local date/time */
function formatDate(isoString) {
  if (!isoString) return 'N/A';
  const d = new Date(isoString);
  return d.toLocaleString('en-BD', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}

// ── CSV Export ────────────────────────────────────────────────────────────────

/** Export an array of objects to a CSV file download */
function exportToCSV(data, filename = 'payments.csv') {
  if (!data || data.length === 0) {
    alert('No data to export.');
    return;
  }
  const headers = ['Name', 'Roll', 'Amount (BDT)', 'Department', 'TRX ID', 'Date/Time'];
  const rows = data.map(p => [
    `"${p.name || ''}"`,
    `"${p.roll || ''}"`,
    p.amount || 0,
    `"${p.department || ''}"`,
    `"${p.trxId || ''}"`,
    `"${formatDate(p.timestamp)}"`
  ]);
  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ── URL Query Params ──────────────────────────────────────────────────────────

/** Get a query parameter value from the current URL */
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name) || '';
}
