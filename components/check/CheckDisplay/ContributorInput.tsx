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

export type ContributorInputProps = InputProps & {
  checkData: CheckDataForm;
  checkId: string;
  contributor: FormState<string>;
  contributorIndex: number;
  setCheckData: Dispatch<SetStateAction<CheckDataForm>>;
  writeAccess: boolean;
};

export const ContributorInput = memo(
  ({
    checkData,
    checkId,
    contributor,
    contributorIndex,
    setCheckData,
    writeAccess,
    ...inputProps
  }: ContributorInputProps) => {
    const router = useRouter();
    const locale = router.locale ?? router.defaultLocale!;
    const { setSnackbar } = useSnackbar();
    const currency = getCurrencyType(locale);

    const handleContributorBlur: FocusEventHandler<HTMLInputElement> = useCallback(async () => {
      try {
        if (writeAccess && contributor.clean !== contributor.dirty) {
          const stateCheckData = { ...checkData };
          stateCheckData.contributors[contributorIndex].name.clean =
            stateCheckData.contributors[contributorIndex].name.dirty;

          const checkDoc = doc(db, "checks", checkId);
          const docCheckData = checkDataToCheck(locale, currency, stateCheckData);
          updateDoc(checkDoc, {
            contributors: docCheckData.contributors,
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

    const handleContributorChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
      if (writeAccess) {
        const stateCheckData = { ...checkData };
        stateCheckData.contributors[contributorIndex].name.dirty = e.target.value;
        setCheckData(stateCheckData);
      }
    }, []);

    return (
      <Input
        {...inputProps}
        onBlur={handleContributorBlur}
        onChange={handleContributorChange}
        value={contributor.dirty}
      />
    );
  }
);

ContributorInput.displayName = "ContributorInput";
