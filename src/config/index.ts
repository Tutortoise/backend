import "dotenv/config";
import admin from "firebase-admin";

export const PORT = process.env.PORT || 8080;

export const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

export const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME!;

if (!GCS_BUCKET_NAME) {
  throw new Error("Missing Google Cloud Storage Bucket Name");
}

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
