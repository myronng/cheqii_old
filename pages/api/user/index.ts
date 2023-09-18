import { Check, UserAdmin } from "declarations";
import { FieldValue } from "firebase-admin/firestore";
import { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser } from "services/authenticator";
import { MethodError } from "services/error";
import { authAdmin, dbAdmin } from "services/firebaseAdmin";
import { withApiErrorHandler } from "services/middleware";
import { parseObjectByKeys } from "services/parser";

// Limit of 500 operations in a single transaction
const MAX_CHECK_UPDATES = 400;
const MAX_CHECK_DELETES = 200; // Has a read + write in each iteration, has 2x the transaction cost

// Don't use a slug for PUT and DELETE because users should only ever manage themselves
export default withApiErrorHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "PUT") {
    // Acts as both account creation and updating
    const authUser = await getAuthUser({ req, res });
    if (authUser) {
      const userId = authUser.uid;
      const userRef = dbAdmin.collection("users").doc(userId);
      await dbAdmin.runTransaction(async (transaction) => {
        const userData = (await transaction.get(userRef)).data() as UserAdmin | undefined;
        if (typeof userData !== "undefined") {
          const newUserData = {
            ...parseObjectByKeys(userData, ["displayName", "email", "payment", "photoURL"]),
            ...req.body,
          };
          const newUserDataStamped = { ...req.body, updatedAt: Date.now() };
          if (typeof userData.checks !== "undefined") {
            const recentChecks = userData.checks.slice(-1 * MAX_CHECK_UPDATES);
            recentChecks.forEach((checkRef) => {
              transaction.update(dbAdmin.collection("checks").doc(checkRef.id), {
                [`users.${userId}`]: newUserData,
              });
            });
          }
          // Use set instead of update to handle new user creation as well
          transaction.set(userRef, newUserDataStamped, { merge: true });
        }
      });
    }
  } else if (req.method === "DELETE") {
    const authUser = await getAuthUser({ req, res });
    if (authUser) {
      const userId = authUser.uid;
      const userRef = dbAdmin.collection("users").doc(userId);
      let hasChecks = true;
      while (hasChecks) {
        await dbAdmin.runTransaction(async (transaction) => {
          const userData = (await transaction.get(userRef)).data() as UserAdmin | undefined;
          if (typeof userData?.checks !== "undefined") {
            const recentChecks = userData.checks.slice(-1 * MAX_CHECK_DELETES);
            if (userData.checks.length === recentChecks.length) {
              hasChecks = false;
            }
            const recentCheckSnapshots = await transaction.getAll(...recentChecks, {
              fieldMask: ["editor", "owner", "users", "viewer"],
            });
            recentCheckSnapshots.forEach((checkSnapshot) => {
              const checkData = checkSnapshot.data() as
                | Pick<Check, "editor" | "owner" | "users" | "viewer">
                | undefined;
              if (checkData) {
                const userIdsInCheck = Object.keys(checkData.users);
                if (userIdsInCheck.length <= 1 && userId in checkData.users) {
                  // If user is the only user in a check, delete the check
                  transaction.delete(checkSnapshot.ref);
                } else {
                  if (checkData.owner.includes(userId) && checkData.owner.length === 1) {
                    // Else if user is the only owner but there are still other users in the check, make all editors (if any) owners, otherwise make all viewers owners
                    if (checkData.editor.length > 0) {
                      transaction.update(checkSnapshot.ref, {
                        editor: [],
                        owner: checkData.editor,
                        [`users.${userId}`]: FieldValue.delete(),
                      });
                    } else {
                      transaction.update(checkSnapshot.ref, {
                        viewer: [],
                        owner: checkData.viewer,
                        [`users.${userId}`]: FieldValue.delete(),
                      });
                    }
                  } else {
                    // Else remove all instances of the deleted user from the check
                    transaction.update(checkSnapshot.ref, {
                      editor: FieldValue.arrayRemove(userId),
                      owner: FieldValue.arrayRemove(userId),
                      viewer: FieldValue.arrayRemove(userId),
                      [`users.${userId}`]: FieldValue.delete(),
                    });
                  }
                }
              }
            });
          } else {
            hasChecks = false;
          }
          transaction.delete(userRef);
        });
        authAdmin.deleteUser(userId);
      }
    }
  } else {
    throw new MethodError(["DELETE", "PUT"]);
  }
  res.status(200).send(undefined);
});
