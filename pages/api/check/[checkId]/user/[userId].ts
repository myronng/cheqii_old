import { Check } from "declarations";
import { FieldValue } from "firebase-admin/firestore";
import strings from "locales/master.json";
import { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser } from "services/authenticator";
import { MethodError, ValidationError } from "services/error";
import { dbAdmin } from "services/firebaseAdmin";
import { withApiErrorHandler } from "services/middleware";

export default withApiErrorHandler(async (req: NextApiRequest, res: NextApiResponse<undefined>) => {
  if (req.method === "DELETE") {
    const authUser = await getAuthUser({ req, res });
    if (authUser) {
      await dbAdmin.runTransaction(async (transaction) => {
        const userId = req.query.userId;
        if (typeof req.query.checkId !== "string" || typeof userId !== "string") {
          throw new ValidationError(strings["invalidQuery"]["en-CA"]);
        }
        const checkRef = dbAdmin.collection("checks").doc(req.query.checkId);
        const checkData = (await transaction.get(checkRef)).data() as Check;
        if (
          typeof checkData !== "undefined" &&
          typeof checkData.users[authUser.uid] !== "undefined"
        ) {
          transaction.set(
            dbAdmin.collection("users").doc(userId),
            {
              checks: FieldValue.arrayRemove(checkRef),
            },
            { merge: true }
          );
          const newCheckData = { ...checkData };
          if (newCheckData.users[userId]) {
            delete newCheckData.users[userId];
            newCheckData.owner = newCheckData.owner.filter(
              (ownerId) => ownerId !== req.query.userId
            );
            newCheckData.editor = newCheckData.editor.filter(
              (editorId) => editorId !== req.query.userId
            );
            newCheckData.viewer = newCheckData.viewer.filter(
              (viewerId) => viewerId !== req.query.userId
            );
            transaction.update(checkRef, newCheckData);
          }
        }
      });
    }
  } else {
    throw new MethodError(["DELETE"]);
  }
  res.status(200).send(undefined);
});
