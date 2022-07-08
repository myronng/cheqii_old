import { Input, InputProps } from "components/check/CheckDisplay/Input";
import { useSnackbar } from "components/SnackbarContextProvider";
import { CheckDataForm } from "declarations";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import { Dispatch, memo, SetStateAction, useCallback } from "react";
import { db } from "services/firebase";
import { formatCurrency } from "services/formatter";
import { getCurrencyType } from "services/locale";
import { isNumericFormat, parseCurrencyAmount, parseNumericFormat } from "services/parser";
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
    const locale = router.locale ?? router.defaultLocale!;
    const { setSnackbar } = useSnackbar();
    const currency = getCurrencyType(locale);

    const handleCostBlur: InputProps["onBlur"] = useCallback(
      async (e, isDirty) => {
        try {
          if (writeAccess) {
            setCheckData((stateCheckData) => {
              const newItems = [...stateCheckData.items];
              const rawValue = parseCurrencyAmount(locale, currency, e.target.value);
              newItems[itemIndex].cost = formatCurrency(locale, rawValue);

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
      [checkId, currency, itemIndex, locale, writeAccess]
    );

    const handleCostChange: InputProps["onChange"] = useCallback(
      (e) => {
        const value = e.target.value;
        if (
          writeAccess &&
          isNumericFormat(locale, value, ["currency", "group", "decimal", "literal"])
        ) {
          setCheckData((stateCheckData) => {
            const newItems = [...stateCheckData.items];
            newItems[itemIndex].cost = value;
            return { ...stateCheckData, items: newItems };
          });
        }
      },
      [itemIndex, locale, writeAccess]
    );

    const handleCostFocus: InputProps["onFocus"] = useCallback(
      (e) => {
        if (writeAccess) {
          setCheckData((stateCheckData) => {
            const newItems = [...stateCheckData.items];
            newItems[itemIndex].cost = parseNumericFormat(locale, e.target.value).toString();
            return { ...stateCheckData, items: newItems };
          });
        }
      },
      [itemIndex, locale, writeAccess]
    );

    return (
      <Input
        {...inputProps}
        onBlur={handleCostBlur}
        onChange={handleCostChange}
        onFocus={handleCostFocus}
      />
    );
  }
);

CostInput.displayName = "CostInput";
