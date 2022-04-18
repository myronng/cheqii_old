import { Input, InputProps } from "components/check/CheckDisplay/Input";
import { useSnackbar } from "components/SnackbarContextProvider";
import { CheckDataForm, FormState } from "declarations";
import { Dinero } from "dinero.js";
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
import { formatInteger } from "services/formatter";
import { getCurrencyType } from "services/locale";
import { isNumericFormat, parseRatioAmount } from "services/parser";
import { checkDataToCheck } from "services/transformer";

export type SplitInputProps = InputProps & {
  checkData: CheckDataForm;
  checkId: string;
  itemIndex: number;
  setCheckData: Dispatch<SetStateAction<CheckDataForm>>;
  split: FormState<string>;
  splitIndex: number;
  writeAccess: boolean;
};

export type TotalsHandle = {
  totalPaid: Map<number, Dinero<number>>;
  totalOwing: Map<number, Dinero<number>>;
};

export const SplitInput = memo(
  ({
    checkData,
    checkId,
    itemIndex,
    setCheckData,
    split,
    splitIndex,
    writeAccess,
    ...inputProps
  }: SplitInputProps) => {
    const router = useRouter();
    const locale = router.locale ?? router.defaultLocale!;
    const { setSnackbar } = useSnackbar();
    const currency = getCurrencyType(locale);

    const handleSplitBlur: FocusEventHandler<HTMLInputElement> = useCallback(async () => {
      try {
        if (writeAccess) {
          const rawValue = parseRatioAmount(locale, split.dirty);
          const stateCheckData = { ...checkData };
          const newSplit = formatInteger(locale, rawValue);
          stateCheckData.items[itemIndex].split[splitIndex].dirty = newSplit;

          if (split.clean !== newSplit) {
            split.clean = newSplit;
            const checkDoc = doc(db, "checks", checkId);
            const docCheckData = checkDataToCheck(locale, currency, stateCheckData);
            updateDoc(checkDoc, {
              items: docCheckData.items,
              updatedAt: Date.now(),
            });
          }
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

    const handleSplitChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
      const value = e.target.value;
      if (writeAccess && isNumericFormat(locale, value, ["group", "literal"])) {
        const stateCheckData = { ...checkData };
        stateCheckData.items[itemIndex].split[splitIndex].dirty = e.target.value;
        setCheckData(stateCheckData);
      }
    }, []);

    const handleSplitFocus: FocusEventHandler<HTMLInputElement> = useCallback((e) => {
      if (writeAccess) {
        const stateCheckData = { ...checkData };
        stateCheckData.items[itemIndex].split[splitIndex].dirty = parseRatioAmount(
          locale,
          e.target.value
        ).toString();
        setCheckData(stateCheckData);
      }
    }, []);

    return (
      <Input
        {...inputProps}
        onBlur={handleSplitBlur}
        onChange={handleSplitChange}
        onFocus={handleSplitFocus}
        value={split.dirty}
      />
    );
  }
);

SplitInput.displayName = "SplitInput";
