import { AddTask } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useAuth } from "components/AuthContextProvider";
import { Skeleton } from "components/home/CheckPreview/Skeleton";
import { redirect } from "components/Link";
import { useLoading } from "components/LoadingContextProvider";
import { useSnackbar } from "components/SnackbarContextProvider";
import { BaseProps, Check, User } from "declarations";
import { signInAnonymously } from "firebase/auth";
import { collection, doc, runTransaction } from "firebase/firestore";
import { ValidationError } from "services/error";
import { auth, db, generateUid } from "services/firebase";
import { interpolateString } from "services/formatter";

type InsertSlotProps = Pick<BaseProps, "className" | "strings">;

export const InsertSlot = styled((props: InsertSlotProps) => {
  const { userInfo } = useAuth();
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();

  const handleClick = async () => {
    try {
      setLoading({ active: true });
      let userId: User["uid"];
      let isAnonymous = false;
      if (typeof userInfo.uid !== "undefined") {
        userId = userInfo.uid;
      } else {
        userId = (await signInAnonymously(auth)).user.uid;
        isAnonymous = true;
      }
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
        let userData = (await transaction.get(userDoc)).data();
        // Allow anonymous users with no data or users that are missing checks to create
        if (typeof userData === "undefined" || typeof userData.checks === "undefined") {
          userData = {
            checks: [checkDoc],
          };
          // Create user.checks here even though pages/check/[checkId] creates a record because
          // of a bug in Firestore rules not interpreting nulls properly when using accessing other
          // documents in a function get()
          transaction.set(userDoc, userData, { merge: true });
        }
        if (typeof userData.checks !== "undefined") {
          if (
            !isAnonymous &&
            typeof process.env.NEXT_PUBLIC_REGISTERED_CHECK_LIMIT !== "undefined" &&
            userData.checks.length >= Number(process.env.NEXT_PUBLIC_REGISTERED_CHECK_LIMIT)
          ) {
            // Check if registered user and has less than limit
            throw new ValidationError(
              interpolateString(props.strings["limitChecksError"], {
                number: process.env.NEXT_PUBLIC_REGISTERED_CHECK_LIMIT,
              })
            );
          } else if (
            isAnonymous &&
            typeof process.env.NEXT_PUBLIC_ANONYMOUS_CHECK_LIMIT !== "undefined" &&
            userData.checks.length >= Number(process.env.NEXT_PUBLIC_ANONYMOUS_CHECK_LIMIT)
          ) {
            // Else check if anonymous user and has less than limit
            throw new ValidationError(
              interpolateString(props.strings["limitChecksError"], {
                number: process.env.NEXT_PUBLIC_ANONYMOUS_CHECK_LIMIT,
              })
            );
          }
          const displayName = userData?.displayName;
          const email = userData?.email;
          const photoURL = userData?.photoURL;
          const checkData: Check = {
            contributors: [
              {
                id: userId,
                name:
                  displayName ||
                  interpolateString(props.strings["contributorIndex"], {
                    index: "1",
                  }),
              },
              {
                id: generateUid(),
                name: interpolateString(props.strings["contributorIndex"], {
                  index: "2",
                }),
              },
            ],
            editor: {},
            invite: {
              id: generateUid(),
              required: userData?.invite?.required ?? true,
              type: userData?.invite?.type ?? "editor",
            },
            items: [
              {
                buyer: 0,
                cost: 0,
                id: generateUid(),
                name: interpolateString(props.strings["itemIndex"], {
                  index: "1",
                }),
                split: [1, 1],
              },
            ],
            owner: {
              [userId]: {}, // Don't populate here in case of undefined data (anonymous user)
            },
            title: `Check ${dateFormatter.format(timestamp)}`,
            updatedAt: Date.now(),
            viewer: {},
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
        }
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
      className={`InsertSlot-root ${props.className}`}
      component="article"
      disabled={loading.active}
      onClick={handleClick}
    >
      <Skeleton component="div" />
      <div className="InsertSlot-overlay">
        <AddTask fontSize="large" />
        <Typography component="h2" variant="h5">
          {props.strings["newCheck"]}
        </Typography>
      </div>
    </LoadingButton>
  );
})`
  ${({ theme }) => `
    background: ${theme.palette.action.hover};
    outline: 2px dashed ${theme.palette.divider};
    padding: 0;
    position: relative;
    border-radius: ${theme.shape.borderRadius}px;

    & .Skeleton-root {
      visibility: hidden;
    }

    & .InsertSlot-overlay {
      align-items: center;
      bottom: 0;
      color: ${theme.palette.text.disabled};
      display: flex;
      gap: ${theme.spacing(2)};
      justify-content: center;
      left: 0;
      position: absolute;
      right: 0;
      top: 0;
    }
  `}
`;

InsertSlot.displayName = "InsertSlot";
