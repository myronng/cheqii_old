import { Input, InputProps } from "components/check/Body/Inputs/Input";
import { useSnackbar } from "components/SnackbarContextProvider";
import { CheckDataForm } from "declarations";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import { Dispatch, memo, SetStateAction, useCallback } from "react";
import { db } from "services/firebase";
import { getCurrencyType, getLocale } from "services/locale";
import { itemStateToItem } from "services/transformer";

export type NameInputProps = InputProps & {
  checkId: string;
  itemIndex: number;
  setCheckData: Dispatch<SetStateAction<CheckDataForm>>;
  writeAccess: boolean;
};

export const NameInput = memo(
  ({ checkId, itemIndex, setCheckData, writeAccess, ...inputProps }: NameInputProps) => {
    const router = useRouter();
    const locale = getLocale(router);
    const { setSnackbar } = useSnackbar();
    const currency = getCurrencyType(locale);

    const handleNameBlur: InputProps["onBlur"] = useCallback(
      async (e, _setValue, isDirty) => {
        try {
          if (writeAccess && isDirty) {
            setCheckData((stateCheckData) => {
              const newItems = [...stateCheckData.items];
              newItems[itemIndex].name = e.target.value;
              const checkDoc = doc(db, "checks", checkId);
              updateDoc(checkDoc, {
                items: itemStateToItem(newItems, locale, currency),
                updatedAt: Date.now(),
              });

              return { ...stateCheckData, items: newItems };
            });
          }
        } catch (err) {
          setSnackbar({
            active: true,
            message: err,
            type: "error",
          });
        }
      },
      [checkId, currency, itemIndex, locale, setCheckData, setSnackbar, writeAccess]
    );

    return <Input {...inputProps} onBlur={handleNameBlur} />;
  }
);

NameInput.displayName = "NameInput";
