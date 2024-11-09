import "dotenv/config";
import admin from "firebase-admin";

export const PORT = process.env.PORT || 8080;

// Firebase Related
if (
  !process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
  !process.env.FIREBASE_DATABASE_URL
) {
  throw new Error("Missing Firebase Service Account Key or Database URL");
}

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string,
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

export const auth = admin.auth();
export const firestore = admin.firestore();
export const messaging = admin.messaging();
