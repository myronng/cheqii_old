import { Input, InputProps } from "components/check/CheckDisplay/Input";
import { CheckDataForm } from "declarations";
import { doc, updateDoc } from "firebase/firestore";
import { Dispatch, memo, SetStateAction, useCallback } from "react";
import { db } from "services/firebase";
import { contributorStateToContributor } from "services/transformer";
import { useSnackbar } from "components/SnackbarContextProvider";

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
      async (_e, isDirty) => {
        try {
          if (writeAccess && isDirty) {
            setCheckData((stateCheckData) => {
              const checkDoc = doc(db, "checks", checkId);
              updateDoc(checkDoc, {
                contributors: contributorStateToContributor(stateCheckData.contributors),
                updatedAt: Date.now(),
              });
              return stateCheckData;
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
      [checkId, writeAccess]
    );

    const handleContributorChange: InputProps["onChange"] = useCallback(
      (e) => {
        if (writeAccess) {
          setCheckData((stateCheckData) => {
            const newContributors = [...stateCheckData.contributors];
            newContributors[contributorIndex].name = e.target.value;
            return { ...stateCheckData, contributors: newContributors };
          });
        }
      },
      [contributorIndex, writeAccess]
    );

    return (
      <Input {...inputProps} onBlur={handleContributorBlur} onChange={handleContributorChange} />
    );
  }
);

ContributorInput.displayName = "ContributorInput";
