import { Add } from "@material-ui/icons";
import { LoadingButton } from "@material-ui/lab";
import { redirect } from "components/Link";
import { signInAnonymously } from "firebase/auth";
import { arrayUnion, collection, doc, writeBatch } from "firebase/firestore";
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
      const batch = writeBatch(db);
      // Create new check document reference
      const checkDoc = doc(collection(db, "checks"));
      const userDoc = doc(db, "users", userId);
      batch.set(checkDoc, {
        name: `Check ${dateFormatter.format(timestamp)}`,
        owner: userId,
      });
      batch.set(
        userDoc,
        {
          checks: arrayUnion(checkDoc),
        },
        { merge: true }
      );
      await batch.commit();
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
