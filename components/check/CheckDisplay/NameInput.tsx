import { Input, InputProps } from "components/check/CheckDisplay/Input";
import { useSnackbar } from "components/SnackbarContextProvider";
import { CheckDataForm, ItemForm } from "declarations";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import { Dispatch, memo, SetStateAction, useCallback } from "react";
import { db } from "services/firebase";
import { getCurrencyType } from "services/locale";
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
    const locale = router.locale ?? router.defaultLocale!;
    const { setSnackbar } = useSnackbar();
    const currency = getCurrencyType(locale);

    const handleNameBlur: InputProps["onBlur"] = useCallback(
      async (_e, isDirty) => {
        try {
          if (writeAccess && isDirty) {
            setCheckData((stateCheckData) => {
              const checkDoc = doc(db, "checks", checkId);
              updateDoc(checkDoc, {
                items: itemStateToItem(stateCheckData.items, locale, currency),
                updatedAt: Date.now(),
              });

              return stateCheckData;
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
      [checkId, setCheckData, writeAccess]
    );

    const handleNameChange: InputProps["onChange"] = useCallback(
      (e) => {
        if (writeAccess) {
          setCheckData((stateCheckData) => {
            const newItems = [...stateCheckData.items];
            newItems[itemIndex].name.dirty = e.target.value;
            return { ...stateCheckData, items: newItems };
          });
        }
      },
      [setCheckData, writeAccess]
    );

    return <Input {...inputProps} onBlur={handleNameBlur} onChange={handleNameChange} />;
  }
);

NameInput.displayName = "NameInput";
