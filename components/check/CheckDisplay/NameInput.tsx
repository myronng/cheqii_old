import { Input, InputProps } from "components/check/CheckDisplay/Input";
import { CheckDataForm, FormState } from "declarations";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import {
  ChangeEventHandler,
  Dispatch,
  FocusEventHandler,
  memo,
  SetStateAction,
  useCallback,
} from "react";
import { db } from "services/firebase";
import { getCurrencyType } from "services/locale";
import { checkDataToCheck } from "services/transformer";
import { useSnackbar } from "utilities/SnackbarContextProvider";

export type NameInputProps = InputProps & {
  checkData: CheckDataForm;
  checkId: string;
  itemIndex: number;
  name: FormState<string>;
  setCheckData: Dispatch<SetStateAction<CheckDataForm>>;
  writeAccess: boolean;
};

export const NameInput = memo(
  ({
    checkData,
    checkId,
    itemIndex,
    name,
    setCheckData,
    writeAccess,
    ...inputProps
  }: NameInputProps) => {
    const router = useRouter();
    const locale = router.locale ?? router.defaultLocale!;
    const { setSnackbar } = useSnackbar();
    const currency = getCurrencyType(locale);

    const handleNameBlur: FocusEventHandler<HTMLInputElement> = useCallback(async () => {
      try {
        if (writeAccess && name.clean !== name.dirty) {
          const stateCheckData = { ...checkData };
          stateCheckData.items[itemIndex].name.clean = stateCheckData.items[itemIndex].name.dirty;

          const checkDoc = doc(db, "checks", checkId);
          const docCheckData = checkDataToCheck(locale, currency, stateCheckData);
          updateDoc(checkDoc, {
            items: docCheckData.items,
            updatedAt: Date.now(),
          });

          setCheckData(stateCheckData);
        }
      } catch (err) {
        setSnackbar({
          active: true,
          message: err,
          type: "error",
        });
      }
    }, []);

    const handleNameChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
      if (writeAccess) {
        const stateCheckData = { ...checkData };
        stateCheckData.items[itemIndex].name.dirty = e.target.value;
        setCheckData(stateCheckData);
      }
    }, []);

    return (
      <Input
        {...inputProps}
        onBlur={handleNameBlur}
        onChange={handleNameChange}
        value={name.dirty}
      />
    );
  }
);

NameInput.displayName = "NameInput";
