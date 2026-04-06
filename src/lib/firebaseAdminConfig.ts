import * as admin from 'firebase-admin';

const serviceAccount = require('../../e-learning-firebase-adminsdk.json'); 

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

export { adminAuth, adminDb }; 