import { auth } from "@/config";
import { initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  signInWithCustomToken,
} from "firebase/auth";

const firebaseApp = initializeApp({
  apiKey: "test-api-key",
  authDomain: "localhost",
  projectId: "tutortoise-test",
});

const clientAuth = getAuth(firebaseApp);
connectAuthEmulator(clientAuth, "http://localhost:9099");

export async function login(userId: string) {
  const customToken = await auth.createCustomToken(userId);
  const { user } = await signInWithCustomToken(clientAuth, customToken);
  return user.getIdToken();
}
