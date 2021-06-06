import { GetServerSideProps, NextPage } from "next";
import Link from "next/link";

interface Props {}

// const uiConfig = {
//   // Popup signin flow rather than redirect flow.
//   signInFlow: "popup",
//   // Redirect to /signedIn after sign in is successful. Alternatively you can provide a callbacks.signInSuccess function.
//   signInSuccessUrl: "/signedIn",
//   // We will display Google and Facebook as auth providers.
//   signInOptions: [
//     firebase.auth.EmailAuthProvider.PROVIDER_ID,
//     firebase.auth.PhoneAuthProvider.PROVIDER_ID,
//     firebase.auth.GoogleAuthProvider.PROVIDER_ID,
//   ],
// };

const Page: NextPage<Props> = (props) => {
  return (
    <main>
      <Link href="/">Home</Link>
    </main>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  };
};

export default Page;
