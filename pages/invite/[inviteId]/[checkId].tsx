import { Splash } from "components/Splash";
import { signInAnonymously } from "firebase/auth";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { UnauthorizedError } from "services/error";
import { auth } from "services/firebase";
import { dbAdmin } from "services/firebaseAdmin";
import { withContextErrorHandler } from "services/middleware";
import { useAuth } from "utilities/AuthContextProvider";

const Page = () => {
  const router = useRouter();
  const userInfo = useAuth();
  useEffect(() => {
    const authenticate = async () => {
      if (!userInfo?.uid) {
        await signInAnonymously(auth);
      }
      router.push(
        `/check/${router.query.checkId}?inviteId=${router.query.inviteId}`,
        `/check/${router.query.checkId}`
      );
    };

    authenticate();
  }, []);
  return <Splash open />;
};

export const getServerSideProps = withContextErrorHandler(async (context) => {
  const check = await dbAdmin
    .collection("checks")
    .doc(context.query.checkId as string)
    .get();
  const checkData = check.data();
  if (typeof checkData !== "undefined") {
    const restricted = checkData.invite.required;
    if (restricted === true) {
      if (context.query.inviteId !== checkData.invite.id) {
        throw new UnauthorizedError();
      }
    }
  } else {
    throw new UnauthorizedError();
  }
  return {
    props: {},
  };
});

export default Page;
