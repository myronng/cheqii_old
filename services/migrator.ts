import { Check, User } from "declarations";
import { User as FirebaseUser } from "firebase/auth";
import { arrayUnion, doc, runTransaction } from "firebase/firestore";
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
      return fillData;
    }
  }
  return null;
};

export const migrateMissingUserData = async (authUser: FirebaseUser) => {
  const userDoc = doc(db, "users", authUser.uid);
  await runTransaction(db, async (transaction) => {
    const userData = (await transaction.get(userDoc)).data() as User;
    const fillData = fillMissingUserData(userData, authUser);
    if (fillData !== null) {
      transaction.set(userDoc, fillData, { merge: true });
    }
  });
};

export const migrateUserData = async (prevUserId: FirebaseUser["uid"], nextUser: FirebaseUser) => {
  const prevUserDoc = doc(db, "users", prevUserId);
  const nextUserDoc = doc(db, "users", nextUser.uid);
  await runTransaction(db, async (transaction) => {
    const prevUserData = (await transaction.get(prevUserDoc)).data() as User;
    const nextUserData = (await transaction.get(nextUserDoc)).data() as User;
    if (prevUserData && nextUserData) {
      if (prevUserData.checks?.length) {
        // Get check permissions containing prevUser and change to nextUser
        const allCheckData = await Promise.all(
          prevUserData.checks.map(
            async (checkDoc) => (await transaction.get(checkDoc)).data() as Check
          )
        );
        allCheckData.forEach((checkData, index) => {
          if (checkData && typeof prevUserData.checks !== "undefined") {
            const nextUserPartial = {
              displayName: nextUser.displayName,
              email: nextUser.email,
              photoURL: nextUser.photoURL,
              uid: nextUser.uid,
            };
            if (checkData.owners?.[prevUserId]) {
              // Migrate ownership
              delete checkData.owners[prevUserId];
              checkData.owners[nextUser.uid] = nextUserPartial;
              transaction.update(prevUserData.checks[index], {
                owner: checkData.owners,
              });
            } else if (checkData.editors?.[prevUserId]) {
              // Migrate editorship
              delete checkData.editors[prevUserId];
              checkData.editors[nextUser.uid] = nextUserPartial;
              transaction.update(prevUserData.checks[index], {
                editors: checkData.editors,
              });
            } else if (checkData.viewers?.[prevUserId]) {
              // Migrate viewership
              delete checkData.viewers[prevUserId];
              checkData.viewers[nextUser.uid] = nextUserPartial;
              transaction.update(prevUserData.checks[index], {
                viewers: checkData.viewers,
              });
            }
          }
        });
        // Move checks from prevUser to nextUser
        transaction.update(nextUserDoc, {
          checks: arrayUnion(...prevUserData.checks),
        });
      }
      // Add user info
      const fillData = fillMissingUserData(nextUserData, nextUser);
      if (fillData !== null) {
        transaction.set(nextUserDoc, fillData, { merge: true });
      }
      transaction.delete(prevUserDoc);
    } else {
      return Promise.reject("User not found");
    }
  });
};
