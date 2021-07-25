import { arrayUnion, doc, runTransaction } from "firebase/firestore";
import { Check, User, UserId } from "declarations";
import { db } from "services/firebase";

export const migrateUserData = async (prevUserId: UserId, nextUserId: UserId) => {
  const prevUserDoc = doc(db, "users", prevUserId);
  const nextUserDoc = doc(db, "users", nextUserId);
  await runTransaction(db, async (transaction) => {
    const prevUserData = (await transaction.get(prevUserDoc)).data() as User;
    if (prevUserData) {
      // Get check permissions containing prevUser and change to nextUser
      for (const checkDoc of prevUserData.checks) {
        const checkData = (await transaction.get(checkDoc)).data() as Check;
        if (checkData) {
          if (checkData.owner === prevUserId) {
            // Migrate ownership
            transaction.update(checkDoc, {
              owner: nextUserId,
            });
          } else if (checkData.editors) {
            // Migrate editorship
            const prevUserIndex = checkData.editors.indexOf(prevUserId);
            if (prevUserIndex !== -1) {
              checkData.editors[prevUserIndex];
              transaction.update(checkDoc, {
                editors: checkData.editors,
              });
            }
          } else if (checkData.viewers) {
            // Migrate viewership
            const prevUserIndex = checkData.viewers.indexOf(prevUserId);
            if (prevUserIndex !== -1) {
              checkData.viewers[prevUserIndex];
              transaction.update(checkDoc, {
                viewers: checkData.viewers,
              });
            }
          }
        }
      }
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
