import type { NextApiRequest, NextApiResponse } from "next";
import { withApiErrorHandler } from "services/middleware";

type Data = {
  name: string;
};

export default withApiErrorHandler((req: NextApiRequest, res: NextApiResponse<Data>) => {
  console.log("hey");
  res.status(200).json({ name: "John Doe" });
});
