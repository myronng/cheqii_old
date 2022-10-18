import { cert, initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, QueryDocumentSnapshot } from "firebase-admin/firestore";

const FIREBASE_ADMIN_CONFIG = {
  credential: cert({
    clientEmail: String(process.env.FIREBASE_CLIENT_EMAIL),
    privateKey: String(process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, "\n"),
    projectId: String(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  }),
};

const firebaseApps = getApps();
export const appAdmin = !firebaseApps.length
  ? initializeApp(FIREBASE_ADMIN_CONFIG)
  : firebaseApps[0];
export const authAdmin = getAuth(appAdmin);
export const dbAdmin = getFirestore(appAdmin);

export const converter = <T>() => ({
  toFirestore: (data: T) => data,
  fromFirestore: (snapshot: QueryDocumentSnapshot) => snapshot.data() as T,
});

export const getUniqueIdAdmin = () => dbAdmin.collection("uid").doc().id;
