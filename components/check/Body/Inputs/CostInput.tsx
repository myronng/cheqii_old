import { Input, InputProps } from "components/check/Body/Inputs/Input";
import { useSnackbar } from "components/SnackbarContextProvider";
import { CheckDataForm } from "declarations";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import { Dispatch, memo, SetStateAction, useCallback } from "react";
import { db } from "services/firebase";
import { formatCurrency } from "services/formatter";
import { getCurrencyType, getLocale } from "services/locale";
import { parseCurrencyAmount, parseNumericFormat } from "services/parser";
import { itemStateToItem } from "services/transformer";

export type CostInputProps = InputProps & {
  checkId: string;
  itemIndex: number;
  setCheckData: Dispatch<SetStateAction<CheckDataForm>>;
  writeAccess: boolean;
};

export const CostInput = memo(
  ({ checkId, itemIndex, setCheckData, writeAccess, ...inputProps }: CostInputProps) => {
    const router = useRouter();
    const locale = getLocale(router);
    const { setSnackbar } = useSnackbar();
    const currency = getCurrencyType(locale);

    const handleCostBlur: InputProps["onBlur"] = useCallback(
      async (e, setValue, isDirty) => {
        try {
          if (writeAccess) {
            const rawValue = parseCurrencyAmount(locale, currency, e.target.value);
            const newValue = formatCurrency(locale, rawValue);
            setValue(newValue);
            setCheckData((stateCheckData) => {
              const newItems = [...stateCheckData.items];
              newItems[itemIndex].cost = newValue;

              if (isDirty) {
                const checkDoc = doc(db, "checks", checkId);
                updateDoc(checkDoc, {
                  items: itemStateToItem(newItems, locale, currency),
                  updatedAt: Date.now(),
                });
              }
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

    const handleCostFocus: InputProps["onFocus"] = useCallback(
      (e, setValue) => {
        if (writeAccess) {
          setValue(parseNumericFormat(locale, e.target.value).toString());
        }
      },
      [locale, writeAccess]
    );

    return (
      <Input
        {...inputProps}
        inputMode="decimal"
        onBlur={handleCostBlur}
        onFocus={handleCostFocus}
      />
    );
  }
);

CostInput.displayName = "CostInput";
