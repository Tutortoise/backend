import { Storage } from "@google-cloud/storage";
import { Client } from "@googlemaps/google-maps-services-js";
import "dotenv/config";
import admin from "firebase-admin";
import { getDatabase } from "firebase-admin/database";

export const PORT = process.env.PORT || 8080;

export const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

export const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME!;

export const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY!;

export const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error("Missing JWT Secret");
}

if (!GOOGLE_MAPS_API_KEY && process.env.NODE_ENV !== "test") {
  throw new Error("Missing Google Maps API Key");
}

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
  options = {
    projectId: "tutortoise-test",
    databaseURL: `http://${process.env.FIREBASE_DATABASE_EMULATOR_HOST}?ns=tutortoise-test`,
  };
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
export const realtimeDb = getDatabase();

export const bucket =
  process.env.NODE_ENV === "test"
    ? admin.storage().bucket(GCS_BUCKET_NAME) // use the firebase storage emulator
    : new Storage().bucket(GCS_BUCKET_NAME);

export const googleMapsClient = new Client();
