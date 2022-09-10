import { FeedbackPage } from "components/feedback";
import localeSubset from "locales/feedback.json";
import { InferGetServerSidePropsType } from "next";
import { getAuthUser } from "services/authenticator";
import { UnauthorizedError } from "services/error";
import { getLocaleStrings } from "services/locale";
import { withContextErrorHandler } from "services/middleware";

export type FeedbackPageProps = InferGetServerSidePropsType<typeof getServerSideProps>;

const Page = (props: FeedbackPageProps) => <FeedbackPage {...props} />;

export const getServerSideProps = withContextErrorHandler(async (context) => {
  const strings = getLocaleStrings(localeSubset, context.locale);
  if (context.req.cookies.authToken) {
    const authUser = await getAuthUser(context);
    if (authUser !== null) {
      return { props: { auth: authUser, strings } };
    }
  }
  throw new UnauthorizedError();
});

export default Page;
