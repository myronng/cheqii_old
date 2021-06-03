import { MethodError, ValidationError } from "services/error";
import { db } from "services/firebase";
import { parseError } from "services/parser";

import type { NextApiRequest, NextApiResponse } from "next";

export type HandlerType = (req: NextApiRequest, res: NextApiResponse) => void;
export type HttpMethodType = Record<string, () => void>;

export const withApiErrorHandler =
  (handler: HandlerType) => async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error(error);
      const timestamp = new Date();
      await db.ref("log").push({
        body: req.body,
        headers: req.headers,
        message: error.stack,
        name: error.name,
        timestamp: timestamp.toISOString(),
      });
      let status;
      if (error instanceof ValidationError) {
        status = 422;
      } else if (error instanceof MethodError) {
        status = 405;
      } else {
        status = 500;
      }
      res.status(status).json({
        errorName: error.name,
        message: parseError(error),
      });
    }
  };

export const withMethodHandler = async (
  req: NextApiRequest,
  res: NextApiResponse,
  methods: HttpMethodType
) => {
  if (typeof req.method !== "undefined") {
    const handler: HandlerType = methods[req.method];
    if (typeof handler === "function") {
      await handler(req, res);
    } else {
      res.setHeader("Allow", Object.keys(methods));
      throw new MethodError(`${req.method} Method Not Allowed`);
    }
  } else {
    res.setHeader("Allow", Object.keys(methods));
    throw new MethodError(`Undefined Method Not Allowed`);
  }
};
