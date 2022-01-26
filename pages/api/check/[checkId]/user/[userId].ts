import { FieldValue } from "firebase-admin/firestore";
import strings from "locales/master.json";
import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser } from "services/authenticator";
import { MethodError, ValidationError } from "services/error";
import { dbAdmin } from "services/firebaseAdmin";
import { withApiErrorHandler } from "services/middleware";

export default withApiErrorHandler(async (req: NextApiRequest, res: NextApiResponse<undefined>) => {
  if (req.method === "DELETE") {
    const authUser = await getAuthUser({ req, res });
    if (authUser) {
      await dbAdmin.runTransaction(async (transaction) => {
        if (typeof req.query.checkId !== "string" || typeof req.query.userId !== "string") {
          throw new ValidationError(strings["invalidQuery"]["en-CA"]);
        }
        const checkRef = dbAdmin.collection("checks").doc(req.query.checkId);
        const check = await transaction.get(checkRef);
        const checkData = check.data();
        if (
          typeof checkData !== "undefined" &&
          typeof checkData.owner[authUser.uid] !== "undefined"
        ) {
          const userId = req.query.userId;
          transaction.set(
            dbAdmin.collection("users").doc(userId),
            {
              checks: FieldValue.arrayRemove(checkRef),
            },
            { merge: true }
          );
          if (checkData.owner?.[userId]) {
            delete checkData.owner[userId];
            transaction.update(checkRef, {
              owner: checkData.owner,
            });
          } else if (checkData.editor?.[userId]) {
            delete checkData.editor[userId];
            transaction.update(checkRef, {
              editor: checkData.editor,
            });
          } else if (checkData.viewer?.[userId]) {
            delete checkData.viewer[userId];
            transaction.update(checkRef, {
              viewer: checkData.viewer,
            });
          }
        }
      });
    }
  } else {
    throw new MethodError(["DELETE"]);
  }
  res.status(200).send(undefined);
});
