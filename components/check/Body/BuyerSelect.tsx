import { Select, SelectProps } from "components/check/Body/Select";
import { useSnackbar } from "components/SnackbarContextProvider";
import { CheckDataForm } from "declarations";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import { Dispatch, memo, SetStateAction, useCallback } from "react";
import { db } from "services/firebase";
import { getCurrencyType, getLocale } from "services/locale";
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
    const locale = getLocale(router);
    const { setSnackbar } = useSnackbar();
    const currency = getCurrencyType(locale);

    const handleBuyerBlur: SelectProps["onBlur"] = useCallback(
      async (e, isDirty) => {
        try {
          if (writeAccess && isDirty) {
            setCheckData((stateCheckData) => {
              const newItems = [...stateCheckData.items];
              newItems[itemIndex].buyer = e.target.value;
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
      [checkId, currency, locale, setCheckData, setSnackbar, writeAccess]
    );

    return <Select {...selectProps} onBlur={handleBuyerBlur} />;
  }
);

BuyerSelect.displayName = "BuyerSelect";
