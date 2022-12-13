import { Check, UserAdmin } from "declarations";
import { FieldValue } from "firebase-admin/firestore";
import strings from "locales/master.json";
import { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser } from "services/authenticator";
import { MethodError, ValidationError } from "services/error";
import { authAdmin, dbAdmin } from "services/firebaseAdmin";
import { withApiErrorHandler } from "services/middleware";

// Limit of 500 operations in a single transaction
const MAX_CHECK_UPDATES = 200; // Has a read + write in each iteration, has 2x the transaction cost

export default withApiErrorHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const toUser = await getAuthUser(req.headers.authorization);

    if (toUser && typeof req.query.token === "string") {
      // toUser receives data from the query token user
      // I.e. query token user is deleted and its data migrates to toUser
      const fromUser = await authAdmin.verifyIdToken(req.query.token);
      await dbAdmin.runTransaction(async (transaction) => {
        const fromUserDoc = dbAdmin.collection("users").doc(fromUser.uid);
        const toUserDoc = dbAdmin.collection("users").doc(toUser.uid);
        const fromUserData = (await transaction.get(fromUserDoc)).data() as UserAdmin | undefined;
        const toUserData = (await transaction.get(toUserDoc)).data() as UserAdmin | undefined;
        if (!fromUserData || !toUserData) {
          throw new ValidationError(strings["noDataToMigrate"]["en-CA"]);
        }
        let updatedUserChecks;
        if (typeof fromUserData.checks !== "undefined" && fromUserData.checks.length > 0) {
          const fromCheckDocs = await transaction.getAll(
            ...fromUserData.checks.slice(-1 * MAX_CHECK_UPDATES)
          );
          fromCheckDocs.forEach((checkDoc, index) => {
            const checkData = checkDoc.data() as Check;
            if (typeof checkData !== "undefined" && typeof fromUserData.checks !== "undefined") {
              // Migrate access if fromUser has higher access than toUser
              const newOwners = checkData.owner.reduce((owners, owner) => {
                if (owner === fromUser.uid) {
                  // If fromUser is an owner then make toUser an owner
                  owners.add(toUser.uid);
                } else {
                  // Else keep all other existing owners
                  owners.add(owner);
                }
                return owners;
              }, new Set());

              const newEditors = checkData.editor.reduce((editors, editor) => {
                if (editor === fromUser.uid) {
                  // If fromUser is an editor then make toUser an editor
                  editors.add(toUser.uid);
                } else {
                  // Else keep all other existing editors
                  editors.add(editor);
                }
                return editors;
              }, new Set());

              const newViewers = checkData.viewer.reduce((viewers, viewer) => {
                if (viewer === fromUser.uid) {
                  // If fromUser is an viewer then make toUser an viewer
                  viewers.add(toUser.uid);
                } else {
                  // Else keep all other existing viewers
                  viewers.add(viewer);
                }
                return viewers;
              }, new Set());
              const newUsers = { ...checkData.users };
              newUsers[toUser.uid] = {
                displayName: toUser.displayName ?? fromUserData.displayName,
                email: toUser.email,
                payment: toUserData.payment ?? fromUserData.payment,
                photoURL: toUser.photoURL ?? fromUserData.email,
              };
              delete newUsers[fromUser.uid];
              // Uses document ref from user's array of check refs
              transaction.update(fromUserData.checks[index], {
                owner: [...newOwners],
                editor: [...newEditors],
                users: newUsers,
                viewer: [...newViewers],
              });
            }
          });

          // Move checks from prevUser to nextUser
          updatedUserChecks = FieldValue.arrayUnion(...fromUserData.checks);
        }
        // Migrate user info, fills any blanks (fromUser --> toUser)
        const updatedUserData: Record<string, any> = {};
        if (typeof updatedUserChecks !== "undefined") {
          updatedUserData.checks = updatedUserChecks;
        }
        if (!toUserData.displayName && fromUserData.displayName) {
          updatedUserData.displayName = fromUserData.displayName;
        }
        if (!toUserData.email && fromUserData.email) {
          updatedUserData.email = fromUserData.email;
        }
        // Only migrate sub-objects when the entire sub-object is missing
        if (!toUserData.invite && fromUserData.invite) {
          updatedUserData.invite = fromUserData.invite;
        }
        if (!toUserData.payment && fromUserData.payment) {
          updatedUserData.payment = fromUserData.payment;
        }
        if (!toUserData.photoURL && fromUserData.photoURL) {
          updatedUserData.photoURL = fromUserData.photoURL;
        }
        // Only update if change detected
        if (Object.keys(updatedUserData).length > 0) {
          transaction.update(toUserDoc, {
            ...fromUserData,
            ...toUserData,
            checks: updatedUserChecks,
          });
        }
        transaction.delete(fromUserDoc);
      });
      authAdmin.deleteUser(fromUser.uid);
    }
  } else {
    throw new MethodError(["POST"]);
  }
  res.status(200).send(undefined);
});
