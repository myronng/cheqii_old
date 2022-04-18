import { Select, SelectProps } from "components/check/CheckDisplay/Select";
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
import { getCurrencyType } from "services/locale";
import { checkDataToCheck } from "services/transformer";

export type BuyerSelectProps = SelectProps & {
  buyer: FormState<number>;
  checkData: CheckDataForm;
  checkId: string;
  disabled: boolean;
  itemIndex: number;
  options: JSX.Element[];
  setCheckData: Dispatch<SetStateAction<CheckDataForm>>;
  writeAccess: boolean;
};

export const BuyerSelect = memo(
  ({
    buyer,
    checkData,
    checkId,
    itemIndex,
    options,
    setCheckData,
    writeAccess,
    ...selectProps
  }: BuyerSelectProps) => {
    const router = useRouter();
    const locale = router.locale ?? router.defaultLocale!;
    const { setSnackbar } = useSnackbar();
    const currency = getCurrencyType(locale);

    const handleBuyerBlur: FocusEventHandler<HTMLSelectElement> = useCallback(async () => {
      try {
        if (writeAccess && buyer.clean !== buyer.dirty) {
          const stateCheckData = { ...checkData };
          stateCheckData.items[itemIndex].buyer.clean = stateCheckData.items[itemIndex].buyer.dirty;

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

    const handleBuyerChange: ChangeEventHandler<HTMLSelectElement> = useCallback((e) => {
      if (writeAccess) {
        const stateCheckData = { ...checkData };
        stateCheckData.items[itemIndex].buyer.dirty = e.target.selectedIndex;
        setCheckData(stateCheckData);
      }
    }, []);

    return (
      <Select
        {...selectProps}
        onBlur={handleBuyerBlur}
        onChange={handleBuyerChange}
        value={buyer.dirty}
      >
        {options}
      </Select>
    );
  }
);

BuyerSelect.displayName = "BuyerSelect";
