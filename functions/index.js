const { onRequest } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');

// Initialize Firebase Admin
initializeApp();

// Import the Express app
const app = require('../server_new');

// Export the Express app as a Firebase Cloud Function
exports.api = onRequest({ timeoutSeconds: 120, memory: '512MiB' }, app);
