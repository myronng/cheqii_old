import { PreferencesPage } from "components/preferences";
import localeSubset from "locales/preferences.json";
import { InferGetServerSidePropsType } from "next";
import { getAuthUser } from "services/authenticator";
import { getLocaleStrings } from "services/locale";
import { withContextErrorHandler } from "services/middleware";

export type PreferencesPageProps = InferGetServerSidePropsType<typeof getServerSideProps>;

const Page = (props: PreferencesPageProps) => <PreferencesPage {...props} />;

export const getServerSideProps = withContextErrorHandler(async (context) => {
  const strings = getLocaleStrings(localeSubset, context.locale);
  if (context.req.cookies.authToken) {
    const decodedToken = await getAuthUser(context);
    if (decodedToken !== null) {
    }
  }
  return { props: { strings } };
});

export default Page;
