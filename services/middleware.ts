import { MethodError, UnauthorizedError, ValidationError } from "services/error";
import { parseError } from "services/parser";

import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  NextApiRequest,
  NextApiResponse,
} from "next";

export type HandlerType = (req: NextApiRequest, res: NextApiResponse) => void;
export type HttpMethodType = Record<string, () => void>;
export type ContextHandlerType = (
  handler: GetServerSideProps
) => (
  context: GetServerSidePropsContext
) => Promise<GetServerSidePropsResult<{ [key: string]: any }>>;

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
      const errorMessage = parseError(error);
      res.status(status).json({
        message: typeof errorMessage === "string" ? errorMessage : "Unknown error",
      });
    }
  };

export const withContextErrorHandler: ContextHandlerType = (handler) => async (context) => {
  try {
    return await handler(context);
  } catch (error) {
    console.error(error);
    if (error instanceof UnauthorizedError) {
      return {
        notFound: true,
      };
    }
    const errorMessage = parseError(error);
    return {
      props: {
        message: typeof errorMessage === "string" ? errorMessage : "Unknown error",
        statusCode: error instanceof ValidationError ? 422 : 500,
      },
    };
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
