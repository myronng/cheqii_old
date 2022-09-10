import { NextApiRequest, NextApiResponse } from "next";
import { getAuthUser } from "services/authenticator";
import { MethodError, UnauthorizedError } from "services/error";
import { withApiErrorHandler } from "services/middleware";

export default withApiErrorHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const authUser = await getAuthUser({ req, res });
    if (!authUser || authUser.isAnonymous !== false) {
      throw new UnauthorizedError();
    }
    const submitUserDetails: string[] = [];
    if (authUser.email) {
      submitUserDetails.push(authUser.email);
    }
    if (authUser.displayName) {
      submitUserDetails.push(authUser.displayName);
    }
    const response = await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY_PATH}/issues`,
      {
        body: JSON.stringify({
          body: `${req.body.body}\n\nSubmitted by: ${authUser.uid}${
            submitUserDetails.length > 0 ? ` (${submitUserDetails.join(", ")})` : ""
          }`,
          labels: ["triage", req.body.feedbackType],
          title: req.body.title,
        }),
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${process.env.GITHUB_AUTH_TOKEN}`,
        },
        method: "POST",
      }
    );
    const responseJson = await response.json();
    res.status(200).json({
      number: responseJson.number,
      url: responseJson.html_url,
    });
  } else {
    throw new MethodError(["POST"]);
  }
});
