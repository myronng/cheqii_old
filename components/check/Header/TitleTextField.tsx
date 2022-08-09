import { TextField, TextFieldProps } from "@mui/material";
import { useSnackbar } from "components/SnackbarContextProvider";
import { CheckSettings } from "declarations";
import { doc, updateDoc } from "firebase/firestore";
import { Dispatch, memo, SetStateAction, useCallback, useRef } from "react";
import { db } from "services/firebase";

export type TitleTextFieldProps = TextFieldProps & {
  checkId: string;
  setSettings: Dispatch<SetStateAction<CheckSettings>>;
  writeAccess: boolean;
};

export const TitleTextField = memo(
  ({ checkId, setSettings, value, writeAccess, ...textFieldProps }: TitleTextFieldProps) => {
    const { setSnackbar } = useSnackbar();
    const cleanValue = useRef(value);

    const handleTitleBlur: TextFieldProps["onBlur"] = useCallback(async () => {
      try {
        if (writeAccess && cleanValue.current !== value) {
          setSettings((stateSettings) => {
            const checkDoc = doc(db, "checks", checkId);
            updateDoc(checkDoc, {
              title: stateSettings.title,
              updatedAt: Date.now(),
            });

            return stateSettings;
          });
          cleanValue.current = value;
        }
      } catch (err) {
        setSnackbar({
          active: true,
          message: err,
          type: "error",
        });
      }
    }, [checkId, setSettings, setSnackbar, value, writeAccess]);

    const handleTitleChange: TextFieldProps["onChange"] = useCallback(
      (e) => {
        if (writeAccess) {
          setSettings((stateSettings) => ({
            ...stateSettings,
            title: e.target.value,
          }));
        }
      },
      [setSettings, writeAccess]
    );

    return (
      <TextField
        {...textFieldProps}
        onBlur={handleTitleBlur}
        onChange={handleTitleChange}
        value={value}
      />
    );
  }
);

TitleTextField.displayName = "TitleTextField";
