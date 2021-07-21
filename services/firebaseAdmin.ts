import { cert, initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { GetServerSidePropsContext } from "next";
import { destroyCookie } from "nookies";

const FIREBASE_CONFIG = {
  credential: cert({
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  }),
};

const firebaseApps = getApps();
const app = !firebaseApps.length ? initializeApp(FIREBASE_CONFIG) : firebaseApps[0];
const auth = getAuth(app);
const db = getFirestore(app);

export const firebaseAdmin = {
  app,
  auth,
  db,
};

export const verifyAuthToken = async (context: GetServerSidePropsContext) => {
  try {
    return await auth.verifyIdToken(context.req.cookies.authToken);
  } catch (err) {
    destroyCookie(context, "authToken", {
      path: "/",
    });
    return null;
  }
};
