import { Input, InputProps } from "components/check/CheckDisplay/Input";
import { useSnackbar } from "components/SnackbarContextProvider";
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
import { formatCurrency } from "services/formatter";
import { getCurrencyType } from "services/locale";
import { isNumericFormat, parseCurrencyAmount, parseNumericFormat } from "services/parser";
import { checkDataToCheck } from "services/transformer";

export type CostInputProps = InputProps & {
  checkData: CheckDataForm;
  checkId: string;
  cost: FormState<string>;
  itemIndex: number;
  setCheckData: Dispatch<SetStateAction<CheckDataForm>>;
  writeAccess: boolean;
};

export const CostInput = memo(
  ({
    checkData,
    checkId,
    cost,
    itemIndex,
    setCheckData,
    writeAccess,
    ...inputProps
  }: CostInputProps) => {
    const router = useRouter();
    const locale = router.locale ?? router.defaultLocale!;
    const { setSnackbar } = useSnackbar();
    const currency = getCurrencyType(locale);

    const handleCostBlur: FocusEventHandler<HTMLInputElement> = useCallback(async () => {
      try {
        if (writeAccess) {
          const rawValue = parseCurrencyAmount(locale, currency, cost.dirty);
          const stateCheckData = { ...checkData };
          const newCost = formatCurrency(locale, rawValue);
          stateCheckData.items[itemIndex].cost.dirty = newCost;

          if (cost.clean !== newCost) {
            stateCheckData.items[itemIndex].cost.clean = stateCheckData.items[itemIndex].cost.dirty;
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

    const handleCostChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
      const value = e.target.value;
      if (
        writeAccess &&
        isNumericFormat(locale, value, ["currency", "group", "decimal", "literal"])
      ) {
        const stateCheckData = { ...checkData };
        stateCheckData.items[itemIndex].cost.dirty = e.target.value;
        setCheckData(stateCheckData);
      }
    }, []);

    const handleCostFocus: FocusEventHandler<HTMLInputElement> = useCallback((e) => {
      if (writeAccess) {
        const stateCheckData = { ...checkData };
        stateCheckData.items[itemIndex].cost.dirty = parseNumericFormat(
          locale,
          e.target.value
        ).toString();
        setCheckData(stateCheckData);
      }
    }, []);

    return (
      <Input
        {...inputProps}
        onBlur={handleCostBlur}
        onChange={handleCostChange}
        onFocus={handleCostFocus}
        value={cost.dirty}
      />
    );
  }
);

CostInput.displayName = "CostInput";
