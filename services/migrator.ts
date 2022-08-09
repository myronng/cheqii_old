import { User } from "declarations";
import { User as FirebaseUser } from "firebase/auth";
import { doc, runTransaction } from "firebase/firestore";
import { db } from "services/firebase";

const fillMissingUserData = (userData: User, authUser: FirebaseUser) => {
  const fillData = {} as User;
  if (authUser) {
    if (!userData.displayName && authUser.displayName) {
      fillData.displayName = authUser.displayName;
    }
    if (!userData.email && authUser.email) {
      fillData.email = authUser.email;
    }
    if (!userData.photoURL && authUser.photoURL) {
      fillData.photoURL = authUser.photoURL;
    }
    if (Object.keys(fillData).length > 0) {
      fillData.updatedAt = Date.now();
      return fillData;
    }
  }
  return null;
};

export const migrateMissingUserData = async (authUser: FirebaseUser) => {
  const userDoc = doc(db, "users", authUser.uid);
  await runTransaction(db, async (transaction) => {
    const userData = (await transaction.get(userDoc)).data() as User | undefined;
    if (typeof userData !== "undefined") {
      const fillData = fillMissingUserData(userData, authUser);
      if (fillData !== null) {
        transaction.set(userDoc, fillData, { merge: true });
      }
    }
  });
};
