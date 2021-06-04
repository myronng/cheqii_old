import { MethodError, ValidationError } from "services/error";
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
      let status;
      if (error instanceof ValidationError) {
        status = 422;
      } else if (error instanceof MethodError) {
        status = 405;
        res.setHeader("Allow", Object.keys(error.allowedMethods));
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
      throw new MethodError(methods);
    }
  } else {
    throw new MethodError(methods);
  }
};
