const admin = require('firebase-admin');
const path = require('path');

let serviceAccount;
try {
    serviceAccount = require('./firebase-service-account.json');
} catch (error) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
        console.error('Missing Firebase Service Account Credentials. Please set FIREBASE_SERVICE_ACCOUNT env var.');
    }
}

if (!admin.apps.length && serviceAccount) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

module.exports = admin;
