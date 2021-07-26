import { User as FirebaseUser } from "@firebase/auth/dist/auth-exp-public";
import { arrayUnion, doc, runTransaction } from "firebase/firestore";
import { Check, User, UserId } from "declarations";
import { db } from "services/firebase";

export const fillUserData = async (authUser: FirebaseUser) => {
  const userDoc = doc(db, "users", authUser.uid);
};

export const migrateUserData = async (prevUserId: UserId, nextUser: FirebaseUser) => {
  const prevUserDoc = doc(db, "users", prevUserId);
  const nextUserDoc = doc(db, "users", nextUser.uid);
  await runTransaction(db, async (transaction) => {
    const prevUserData = (await transaction.get(prevUserDoc)).data() as User;
    if (prevUserData) {
      // Get check permissions containing prevUser and change to nextUser
      const allCheckData = await Promise.all(
        prevUserData.checks.map(
          async (checkDoc) => (await transaction.get(checkDoc)).data() as Check
        )
      );
      allCheckData.forEach((checkData, index) => {
        if (checkData) {
          if (checkData.owner === prevUserId) {
            // Migrate ownership
            transaction.update(prevUserData.checks[index], {
              owner: nextUser.uid,
            });
          } else if (checkData.editors) {
            // Migrate editorship
            const prevUserIndex = checkData.editors.indexOf(prevUserId);
            if (prevUserIndex !== -1) {
              checkData.editors[prevUserIndex];
              transaction.update(prevUserData.checks[index], {
                editors: checkData.editors,
              });
            }
          } else if (checkData.viewers) {
            // Migrate viewership
            const prevUserIndex = checkData.viewers.indexOf(prevUserId);
            if (prevUserIndex !== -1) {
              checkData.viewers[prevUserIndex];
              transaction.update(prevUserData.checks[index], {
                viewers: checkData.viewers,
              });
            }
          }
        }
      });
      // Move checks from prevUser to nextUser
      transaction.update(nextUserDoc, {
        checks: arrayUnion(...prevUserData.checks),
      });
      transaction.delete(prevUserDoc);
    } else {
      return Promise.reject("User not found");
    }
  });
};
