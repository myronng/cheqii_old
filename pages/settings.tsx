import { SettingsPage } from "components/settings";
import walletTypes from "config/walletTypes.json";
import { UserAdmin } from "declarations";
import localeSubset from "locales/settings.json";
import { InferGetServerSidePropsType } from "next";
import { getAuthUser } from "services/authenticator";
import { UnauthorizedError } from "services/error";
import { dbAdmin } from "services/firebaseAdmin";
import { getLocaleStrings } from "services/locale";
import { withContextErrorHandler } from "services/middleware";

export type SettingsPageProps = InferGetServerSidePropsType<typeof getServerSideProps>;

const Page = (props: SettingsPageProps) => <SettingsPage {...props} />;

export const getServerSideProps = withContextErrorHandler(async (context) => {
  const strings = getLocaleStrings(localeSubset, context.locale);
  if (context.req.cookies.authToken) {
    const authUser = await getAuthUser(context);
    if (authUser !== null) {
      const userDoc = dbAdmin.collection("users").doc(authUser.uid);
      const { checks, ...userData } = (await userDoc.get()).data() as UserAdmin;

      const localeWalletTypes = walletTypes.default.concat(
        // Gracefully handles undefined locales as well
        walletTypes[context.locale as keyof typeof walletTypes]
      );
      const collator = new Intl.Collator(context.locales);
      localeWalletTypes.sort(collator.compare);

      return {
        props: { auth: authUser, walletTypes: localeWalletTypes, strings, userData },
      };
    }
  }
  throw new UnauthorizedError();
});

export default Page;
