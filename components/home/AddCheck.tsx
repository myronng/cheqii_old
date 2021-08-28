import { Add } from "@material-ui/icons";
import { LoadingButton } from "@material-ui/lab";
import { redirect } from "components/Link";
import { BaseProps, Check, User } from "declarations";
import { signInAnonymously } from "firebase/auth";
import { arrayUnion, collection, doc, runTransaction } from "firebase/firestore";
import { auth, db } from "services/firebase";
import { useAuth } from "utilities/AuthContextProvider";
import { useLoading } from "utilities/LoadingContextProvider";
import { useSnackbar } from "utilities/SnackbarContextProvider";

type AddCheckProps = Pick<BaseProps, "strings">;

export const AddCheck = (props: AddCheckProps) => {
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
        const email = userData.email;
        const photoURL = userData.photoURL;
        const checkData: Check = {
          contributors: [displayName || props.strings["anonymous"]],
          items: [
            {
              buyer: 0,
              cost: 0,
              id: doc(collection(db, "checks")).id,
              name: props.strings["newItem"],
              split: [1],
            },
          ],
          name: `Check ${dateFormatter.format(timestamp)}`,
          owner: {
            [userId]: {},
          },
        };
        if (checkData.owner) {
          if (displayName) {
            checkData.owner[userId].displayName = displayName;
          }
          if (email) {
            checkData.owner[userId].email = email;
          }
          if (photoURL) {
            checkData.owner[userId].photoURL = photoURL;
          }
        }

        transaction.set(checkDoc, checkData);
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
      {props.strings["newCheck"]}
    </LoadingButton>
  );
};
