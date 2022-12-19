import { MethodError, UnauthorizedError, ValidationError } from "services/error";
import { parseError } from "services/parser";

import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
  NextApiRequest,
  NextApiResponse,
} from "next";

export type HandlerType = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
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
      if (error instanceof UnauthorizedError) {
        status = 401;
      } else if (error instanceof ValidationError) {
        status = 422;
      } else if (error instanceof MethodError) {
        status = 405;
        res.setHeader("Allow", Object.keys(error.allowedMethods));
      } else {
        status = 500;
      }
      const errorMessage = parseError(error);
      res.status(status).json({
        message: typeof errorMessage === "string" ? errorMessage : "",
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
        title: error instanceof Error ? error.name : undefined,
        message: typeof errorMessage === "string" ? errorMessage : "",
        statusCode: error instanceof ValidationError ? 422 : 500,
      },
    };
  }
};
