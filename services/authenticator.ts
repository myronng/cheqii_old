import { AuthUser } from "declarations";
import { FirebaseError } from "firebase-admin";
import { authAdmin } from "services/firebaseAdmin";

export const getAuthUser: (token?: string) => Promise<AuthUser | false> = async (token) => {
  try {
    if (token) {
      const authorization = token.split(" ");
      const decodedToken = await authAdmin.verifyIdToken(authorization[1]);
      return {
        displayName: decodedToken.name || null,
        email: decodedToken.email || null,
        isAnonymous: decodedToken.firebase.sign_in_provider === "anonymous",
        photoURL: decodedToken.picture || null,
        uid: decodedToken.uid,
      };
    } else {
      return null;
    }
  } catch (err) {
    const firebaseError = err as FirebaseError;
    if (firebaseError.code === "auth/id-token-expired") {
      return false;
    }
    return null;
  }
};
