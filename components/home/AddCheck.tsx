import { Add } from "@material-ui/icons";
import { LoadingButton } from "@material-ui/lab";
import { redirect } from "components/Link";
import { User } from "declarations";
import { signInAnonymously } from "firebase/auth";
import { arrayUnion, collection, doc, runTransaction } from "firebase/firestore";
import { auth, db } from "services/firebase";
import { useAuth } from "utilities/AuthContextProvider";
import { useLoading } from "utilities/LoadingContextProvider";
import { useSnackbar } from "utilities/SnackbarContextProvider";

export const AddCheck = () => {
  const userInfo = useAuth();
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();

  const handleClick = async () => {
    try {
      setLoading({ active: true });
      const userId = userInfo.uid ? userInfo.uid : (await signInAnonymously(auth)).user.uid;
      const timestamp = new Date();
      const dateFormatter = Intl.DateTimeFormat("en-CA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      // Create new check document reference
      const checkDoc = doc(collection(db, "checks"));
      const userDoc = doc(db, "users", userId);
      await runTransaction(db, async (transaction) => {
        const userData = (await transaction.get(userDoc)).data() as User;
        const displayName = userData.displayName;
        const photoURL = userData.photoURL;
        transaction.set(checkDoc, {
          items: [],
          name: `Check ${dateFormatter.format(timestamp)}`,
          owners: {
            [userId]: {
              ...(displayName && { displayName }),
              email: userData.email,
              ...(photoURL && { photoURL }),
            },
          },
        });
        transaction.set(
          userDoc,
          {
            checks: arrayUnion(checkDoc),
          },
          { merge: true }
        );
      });
      redirect(setLoading, `/check/${checkDoc.id}`);
    } catch (err) {
      setSnackbar({
        active: true,
        message: err,
        type: "error",
      });
      setLoading({ active: false });
    }
  };

  return (
    <LoadingButton
      disabled={loading.active}
      onClick={handleClick}
      startIcon={<Add />}
      variant="contained"
    >
      New Check
    </LoadingButton>
  );
};
