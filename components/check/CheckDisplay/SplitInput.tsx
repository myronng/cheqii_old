import { Input, InputProps } from "components/check/CheckDisplay/Input";
import { useSnackbar } from "components/SnackbarContextProvider";
import { CheckDataForm } from "declarations";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import { Dispatch, memo, SetStateAction, useCallback } from "react";
import { db } from "services/firebase";
import { formatInteger } from "services/formatter";
import { getCurrencyType } from "services/locale";
import { isNumericFormat, parseRatioAmount } from "services/parser";
import { itemStateToItem } from "services/transformer";

export type SplitInputProps = InputProps & {
  checkId: string;
  itemIndex: number;
  setCheckData: Dispatch<SetStateAction<CheckDataForm>>;
  splitIndex: number;
  writeAccess: boolean;
};

export const SplitInput = memo(
  ({
    checkId,
    itemIndex,
    setCheckData,
    splitIndex,
    writeAccess,
    ...inputProps
  }: SplitInputProps) => {
    const router = useRouter();
    const locale = router.locale ?? router.defaultLocale!;
    const { setSnackbar } = useSnackbar();
    const currency = getCurrencyType(locale);

    const handleSplitBlur: InputProps["onBlur"] = useCallback(
      async (e, isDirty) => {
        try {
          if (writeAccess) {
            setCheckData((stateCheckData) => {
              const newItems = [...stateCheckData.items];
              const rawValue = parseRatioAmount(locale, e.target.value);
              newItems[itemIndex].split[splitIndex] = formatInteger(locale, rawValue);

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
      [checkId, currency, locale, writeAccess]
    );

    const handleSplitChange: InputProps["onChange"] = useCallback(
      (e) => {
        const value = e.target.value;
        if (writeAccess && isNumericFormat(locale, value, ["group", "literal"])) {
          setCheckData((stateCheckData) => {
            const newItems = [...stateCheckData.items];
            newItems[itemIndex].split[splitIndex] = value;
            return { ...stateCheckData, items: newItems };
          });
        }
      },
      [locale, writeAccess]
    );

    const handleSplitFocus: InputProps["onFocus"] = useCallback(
      (e) => {
        if (writeAccess) {
          setCheckData((stateCheckData) => {
            const newItems = [...stateCheckData.items];
            newItems[itemIndex].split[splitIndex] = parseRatioAmount(
              locale,
              e.target.value
            ).toString();
            return { ...stateCheckData, items: newItems };
          });
        }
      },
      [locale, writeAccess]
    );

    return (
      <Input
        {...inputProps}
        onBlur={handleSplitBlur}
        onChange={handleSplitChange}
        onFocus={handleSplitFocus}
      />
    );
  }
);

SplitInput.displayName = "SplitInput";
