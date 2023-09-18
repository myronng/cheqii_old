import { Check } from "declarations";
import strings from "locales/master.json";
import { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser } from "services/authenticator";
import { MethodError, ValidationError } from "services/error";
import { dbAdmin, getUniqueIdAdmin } from "services/firebaseAdmin";
import { withApiErrorHandler } from "services/middleware";

export default withApiErrorHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    // Allow linking account to contributor for view-only users
    const authUser = await getAuthUser({ req, res });
    if (authUser) {
      await dbAdmin.runTransaction(async (transaction) => {
        const contributorId = req.query.contributorId;
        if (typeof req.query.checkId !== "string" || typeof contributorId !== "string") {
          throw new ValidationError(strings["invalidQuery"]["en-CA"]);
        }
        const checkRef = dbAdmin.collection("checks").doc(req.query.checkId);
        const checkData = (await transaction.get(checkRef)).data() as Check;
        if (typeof checkData !== "undefined") {
          const contributorIndex = checkData.contributors.findIndex(
            (contributor) => contributor.id === contributorId
          );
          if (contributorIndex === -1) {
            throw new ValidationError(strings["invalidQuery"]["en-CA"]);
          }
          checkData.contributors[contributorIndex].id = authUser.uid;

          transaction.set(
            checkRef,
            {
              contributors: checkData.contributors,
            },
            { merge: true }
          );
        }
      });
    }
  } else if (req.method === "DELETE") {
    // Allow unlinking account to contributor for view-only users
    const authUser = await getAuthUser({ req, res });
    if (authUser) {
      await dbAdmin.runTransaction(async (transaction) => {
        const contributorId = req.query.contributorId;
        if (typeof req.query.checkId !== "string" || typeof contributorId !== "string") {
          throw new ValidationError(strings["invalidQuery"]["en-CA"]);
        }
        const checkRef = dbAdmin.collection("checks").doc(req.query.checkId);
        const checkData = (await transaction.get(checkRef)).data() as Check;
        if (typeof checkData !== "undefined") {
          const contributorIndex = checkData.contributors.findIndex(
            (contributor) => contributor.id === authUser.uid
          );
          if (contributorIndex === -1) {
            throw new ValidationError(strings["invalidQuery"]["en-CA"]);
          }
          checkData.contributors[contributorIndex].id = getUniqueIdAdmin();

          transaction.set(
            checkRef,
            {
              contributors: checkData.contributors,
            },
            { merge: true }
          );
        }
      });
    }
  } else {
    throw new MethodError(["POST", "DELETE"]);
  }
  res.status(200).send(undefined);
});
