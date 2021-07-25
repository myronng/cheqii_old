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
      setLoading({
        active: true,
        id: "addCheck",
      });
      const userId = userInfo.uid ? userInfo.uid : (await signInAnonymously(auth)).user.uid;
      const timestamp = new Date();
      const dateFormatter = Intl.DateTimeFormat("en-CA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const batch = writeBatch(db);
      // Create new check reference
      const checkRef = doc(collection(db, "checks"));
      const userRef = doc(db, "users", userId);
      batch.set(checkRef, {
        name: `Check ${dateFormatter.format(timestamp)}`,
        owner: userId,
      });
      batch.set(
        userRef,
        {
          checks: arrayUnion(checkRef),
        },
        { merge: true }
      );
      await batch.commit();
      redirect(setLoading, `/check/${checkRef.id}`);
    } catch (err) {
      setSnackbar({
        active: true,
        message: err,
        type: "error",
      });
      setLoading({
        active: false,
        id: "addCheck",
      });
    }
  };

  return (
    <LoadingButton
      disabled={loading.active}
      loading={loading.queue.includes("addCheck")}
      onClick={handleClick}
      startIcon={<Add />}
      variant="contained"
    >
      New Check
    </LoadingButton>
  );
};
