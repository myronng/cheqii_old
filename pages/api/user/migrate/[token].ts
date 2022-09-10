import { AuthUser, UserAdmin } from "declarations";
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
          const toUserPartial = {
            displayName: toUser.displayName,
            email: toUser.email,
            photoURL: toUser.photoURL,
          };
          const fromCheckDocs = await transaction.getAll(...fromUserData.checks);

          fromCheckDocs.forEach((checkDoc, index) => {
            const checkData = checkDoc.data();
            if (typeof checkData !== "undefined" && typeof fromUserData.checks !== "undefined") {
              // Migrate access if fromUser has higher access than toUser
              if (checkData.owner[toUser.uid]) {
                // If toUser is an owner, remove fromUser; already at highest access
                delete checkData.owner[fromUser.uid];
                delete checkData.editor[fromUser.uid];
                delete checkData.viewer[fromUser.uid];
              } else if (checkData.editor[toUser.uid]) {
                // If toUser is an editor then...
                if (checkData.owner[fromUser.uid]) {
                  // If fromUser is an owner, set toUser to owner
                  checkData.owner[toUser.uid] = toUserPartial;
                  delete checkData.owner[fromUser.uid];
                } else {
                  // Else fromUser is same or lower access as toUser; remove fromUser
                  delete checkData.editor[fromUser.uid];
                  delete checkData.viewer[fromUser.uid];
                }
              } else if (checkData.viewer[toUser.uid]) {
                // If toUser is a viewer then...
                if (checkData.owner[fromUser.uid]) {
                  // If fromUser is an owner, set toUser to owner
                  checkData.owner[toUser.uid] = toUserPartial;
                  delete checkData.owner[fromUser.uid];
                } else if (checkData.editor[fromUser.uid]) {
                  // Else if fromUser is an editor, set toUser to editor
                  checkData.editor[toUser.uid] = toUserPartial;
                  delete checkData.editor[fromUser.uid];
                } else {
                  // Else fromUser is same access; remove fromUser
                  delete checkData.viewer[fromUser.uid];
                }
              }
              // Uses document ref from user's array of check refs
              transaction.update(fromUserData.checks[index], {
                owner: checkData.owner,
                editor: checkData.editor,
                viewer: checkData.viewer,
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
