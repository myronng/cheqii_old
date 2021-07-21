import { Add } from "@material-ui/icons";
import { LoadingButton } from "@material-ui/lab";
import { signInAnonymously } from "firebase/auth";
import { arrayUnion, collection, doc, writeBatch } from "firebase/firestore";
import { firebase } from "services/firebase";
import { redirect } from "services/redirect";
import { useAuth } from "utilities/AuthContextProvider";
import { useLoading } from "utilities/LoadingContextProvider";
import { useSnackbar } from "utilities/SnackbarContextProvider";

export const AddCheck = () => {
  const userInfo = useAuth();
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();
  const { db } = firebase;

  const handleClick = async () => {
    try {
      setLoading({
        active: true,
        id: "addCheck",
      });
      const userId = userInfo.uid
        ? userInfo.uid
        : (await signInAnonymously(firebase.auth)).user.uid;
      setLoading({
        active: false,
        id: "addCheck",
      });
      const timestamp = new Date();
      const dateFormatter = Intl.DateTimeFormat("en-CA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const batch = writeBatch(db);
      const checkRef = doc(collection(db, "checks"));
      const userRef = doc(collection(db, "users"), userId);
      batch.set(checkRef, {
        name: dateFormatter.format(timestamp),
        users: arrayUnion({ type: "owner", uid: userId }),
      });
      batch.set(userRef, {
        checks: arrayUnion(checkRef),
      });
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
