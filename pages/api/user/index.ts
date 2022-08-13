import { UserAdmin } from "declarations";
import { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser } from "services/authenticator";
import { MethodError } from "services/error";
import { dbAdmin } from "services/firebaseAdmin";
import { withApiErrorHandler } from "services/middleware";
import { parseObjectByKeys } from "services/parser";

const MAX_CHECKS_UPDATED = 100;

export default withApiErrorHandler(async (req: NextApiRequest, res: NextApiResponse<undefined>) => {
  if (req.method === "PUT") {
    const authUser = await getAuthUser({ req, res });
    if (authUser) {
      await dbAdmin.runTransaction(async (transaction) => {
        const userId = authUser.uid;
        const newUserData = parseObjectByKeys(req.body, ["displayName", "email", "photoURL"]);
        const newUserDataStamped = { ...newUserData, updatedAt: Date.now() };
        const userData = (
          await transaction.get(dbAdmin.collection("users").doc(userId))
        ).data() as UserAdmin;
        if (typeof userData !== "undefined" && typeof userData.checks !== "undefined") {
          const recentChecks = userData.checks.slice(-1 * MAX_CHECKS_UPDATED);
          // Limit of 500 operations in a single transaction
          recentChecks.map((checkRef) =>
            transaction.update(dbAdmin.collection("checks").doc(checkRef.id), {
              [`users.${userId}`]: newUserData,
            })
          );
        }
        transaction.update(dbAdmin.collection("users").doc(userId), newUserDataStamped);
      });
    }
  } else {
    throw new MethodError(["PUT"]);
  }
  res.status(200).send(undefined);
});
