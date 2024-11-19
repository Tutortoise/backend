import { Storage } from "@google-cloud/storage";
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
  process.env.NODE_ENV !== "test" &&
  (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    !process.env.FIREBASE_DATABASE_URL)
) {
  throw new Error("Missing Firebase Service Account Key or Database URL");
}

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : undefined;

let options: admin.AppOptions;
if (process.env.NODE_ENV === "test") {
  options = { projectId: "tutortoise-test" };
} else {
  options = {
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  };
}

admin.initializeApp(options);

export const auth = admin.auth();
export const firestore = admin.firestore();
export const messaging = admin.messaging();
export const bucket = new Storage().bucket(GCS_BUCKET_NAME);
