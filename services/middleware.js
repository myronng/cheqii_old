import { MethodError, ValidationError } from "services/error";
import { db } from "services/firebase";
import { parseError } from "services/parser";

export const withApiErrorHandler = (handler) => async (req, res) => {
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

export const withMethodHandler = async (req, res, methods) => {
  const handler = methods[req.method];
  if (typeof handler === "function") {
    await handler();
  } else {
    res.setHeader("Allow", Object.keys(methods));
    throw new MethodError(`Method ${req.method} Not Allowed`);
  }
};
