import { FieldValue } from "firebase-admin/firestore";
import strings from "locales/master.json";
import { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser } from "services/authenticator";
import { MethodError, ValidationError } from "services/error";
import { dbAdmin } from "services/firebaseAdmin";
import { withApiErrorHandler } from "services/middleware";

export default withApiErrorHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "DELETE") {
    const authUser = await getAuthUser({ req, res });
    if (authUser) {
      await dbAdmin.runTransaction(async (transaction) => {
        if (typeof req.query.checkId !== "string") {
          throw new ValidationError(strings["invalidQuery"]["en-CA"]);
        }
        const checkRef = dbAdmin.collection("checks").doc(req.query.checkId);
        const check = await transaction.get(checkRef);
        const checkData = check.data();
        if (typeof checkData !== "undefined" && checkData.owner.includes(authUser.uid)) {
          const users = await transaction.get(
            dbAdmin.collection("users").where("checks", "array-contains", checkRef)
          );
          users.forEach((userDoc) => {
            transaction.set(
              userDoc.ref,
              {
                checks: FieldValue.arrayRemove(checkRef),
              },
              { merge: true }
            );
          });
          transaction.delete(checkRef);
        }
      });
    }
  } else {
    throw new MethodError(["DELETE"]);
  }
  res.status(200).send(undefined);
});
