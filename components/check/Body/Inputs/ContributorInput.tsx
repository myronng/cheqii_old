import { Input, InputProps } from "components/check/Body/Inputs/Input";
import { useSnackbar } from "components/SnackbarContextProvider";
import { CheckDataForm } from "declarations";
import { doc, updateDoc } from "firebase/firestore";
import { Dispatch, memo, SetStateAction, useCallback } from "react";
import { db } from "services/firebase";
import { contributorStateToContributor } from "services/transformer";

export type ContributorInputProps = InputProps & {
  checkId: string;
  contributorIndex: number;
  setCheckData: Dispatch<SetStateAction<CheckDataForm>>;
  writeAccess: boolean;
};

export const ContributorInput = memo(
  ({
    checkId,
    contributorIndex,
    setCheckData,
    writeAccess,
    ...inputProps
  }: ContributorInputProps) => {
    const { setSnackbar } = useSnackbar();

    const handleContributorBlur: InputProps["onBlur"] = useCallback(
      async (e, _setValue, isDirty) => {
        try {
          if (writeAccess && isDirty) {
            setCheckData((stateCheckData) => {
              const newContributors = [...stateCheckData.contributors];
              newContributors[contributorIndex].name = e.target.value;
              const checkDoc = doc(db, "checks", checkId);
              updateDoc(checkDoc, {
                contributors: contributorStateToContributor(newContributors),
                updatedAt: Date.now(),
              });
              return { ...stateCheckData, contributors: newContributors };
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
      [checkId, contributorIndex, setCheckData, setSnackbar, writeAccess]
    );

    return <Input {...inputProps} onBlur={handleContributorBlur} />;
  }
);

ContributorInput.displayName = "ContributorInput";
