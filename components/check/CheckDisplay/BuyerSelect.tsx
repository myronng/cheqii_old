import { Select, SelectProps } from "components/check/CheckDisplay/Select";
import { useSnackbar } from "components/SnackbarContextProvider";
import { CheckDataForm } from "declarations";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import { Dispatch, memo, SetStateAction, useCallback } from "react";
import { db } from "services/firebase";
import { getCurrencyType } from "services/locale";
import { itemStateToItem } from "services/transformer";

export type BuyerSelectProps = SelectProps & {
  checkId: string;
  itemIndex: number;
  setCheckData: Dispatch<SetStateAction<CheckDataForm>>;
  writeAccess: boolean;
};

export const BuyerSelect = memo(
  ({ checkId, itemIndex, setCheckData, writeAccess, ...selectProps }: BuyerSelectProps) => {
    const router = useRouter();
    const locale = router.locale ?? String(router.defaultLocale);
    const { setSnackbar } = useSnackbar();
    const currency = getCurrencyType(locale);

    const handleBuyerBlur: SelectProps["onBlur"] = useCallback(
      async (_e, isDirty) => {
        try {
          if (writeAccess && isDirty) {
            setCheckData((stateCheckData) => {
              const checkDoc = doc(db, "checks", checkId);
              updateDoc(checkDoc, {
                items: itemStateToItem(stateCheckData.items, locale, currency),
                updatedAt: Date.now(),
              });
              return stateCheckData; // Don't re-render
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
      [checkId, currency, locale, setCheckData, setSnackbar, writeAccess]
      // Don't need to add state setters in deps array because they remain uniform
    );

    const handleBuyerChange: SelectProps["onChange"] = useCallback(
      (e) => {
        if (writeAccess) {
          setCheckData((stateCheckData) => {
            const newItems = [...stateCheckData.items];
            newItems[itemIndex].buyer = e.target.selectedIndex;
            return { ...stateCheckData, items: newItems };
          });
        }
      },
      [itemIndex, setCheckData, writeAccess]
    );

    return <Select {...selectProps} onBlur={handleBuyerBlur} onChange={handleBuyerChange} />;
  }
);

BuyerSelect.displayName = "BuyerSelect";
