import { cert, initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const FIREBASE_CONFIG = {
  credential: cert({
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  }),
};

if (!getApps().length) {
  initializeApp(FIREBASE_CONFIG);
}

export const verifyAuthToken = async (authToken: string) => {
  const auth = getAuth();
  return await auth.verifyIdToken(authToken);
};
