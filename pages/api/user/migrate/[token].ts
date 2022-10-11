import { AuthUser, Check, UserAdmin } from "declarations";
import { DecodedIdToken } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import strings from "locales/master.json";
import { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser } from "services/authenticator";
import { MethodError, ValidationError } from "services/error";
import { authAdmin, dbAdmin } from "services/firebaseAdmin";
import { withApiErrorHandler } from "services/middleware";

export default withApiErrorHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const toUser = await getAuthUser({ req, res });

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
        if (typeof fromUserData.checks !== "undefined" && fromUserData.checks.length > 0) {
          const fromCheckDocs = await transaction.getAll(...fromUserData.checks);

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
                displayName: toUser.displayName,
                email: toUser.email,
                payment: toUserData.payment ?? fromUserData.payment,
                photoURL: toUser.photoURL,
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
          transaction.update(toUserDoc, {
            checks: FieldValue.arrayUnion(...fromUserData.checks),
          });
        }
        // Add user info
        const fillData = fillMissingUserData(fromUser, toUser);
        if (fillData !== null) {
          transaction.update(toUserDoc, fillData);
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

const fillMissingUserData = (fromUser: DecodedIdToken, toUser: AuthUser) => {
  const fillData = { ...toUser };
  if (!fillData.displayName && fromUser.displayName) {
    fillData.displayName = fromUser.displayName;
  }
  if (!fillData.email && fromUser.email) {
    fillData.email = fromUser.email;
  }
  if (!fillData.photoURL && fromUser.photoURL) {
    fillData.photoURL = fromUser.photoURL;
  }
  if (Object.keys(fillData).length > 0) {
    return fillData;
  }
  return null;
};
