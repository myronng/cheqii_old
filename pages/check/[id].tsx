import { CheckUser } from "declarations";
import { GetServerSideProps } from "next";
import { firebase } from "services/firebase";
import { firebaseAdmin, verifyAuthToken } from "services/firebaseAdmin";
import { useAuth } from "utilities/AuthContextProvider";
import { useLoading } from "utilities/LoadingContextProvider";
import { useSnackbar } from "utilities/SnackbarContextProvider";

const Page = () => {
  const userInfo = useAuth();
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();

  return <div></div>;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const props = {
    auth: {},
  };
  if (context.req.cookies.authToken) {
    const decodedToken = await verifyAuthToken(context);
    if (decodedToken !== null) {
      const { db } = firebaseAdmin;
      const checkUserRef = await db
        .collection("checks")
        .doc(context.query.id as string)
        .get();
      const checkUserData = checkUserRef.data()?.users as CheckUser;
      if (checkUserData.some((user) => (user.uid = decodedToken.uid))) {
        props.auth = {
          email: typeof decodedToken.email === "string" ? decodedToken.email : null,
          uid: decodedToken.uid,
        };
        return {
          props,
        };
      }
    }
  }

  return {
    notFound: true,
  };
};

export default Page;
