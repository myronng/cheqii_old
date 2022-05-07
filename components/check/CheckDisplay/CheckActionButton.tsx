import { PersonAdd, Share } from "@mui/icons-material";
import { ActionButton } from "components/ActionButton";
import { CheckSettingsProps } from "components/check/CheckHeader/CheckSettings";
import { useSnackbar } from "components/SnackbarContextProvider";
import { BaseProps, CheckDataForm } from "declarations";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import { Dispatch, memo, SetStateAction, useCallback } from "react";
import { db, generateUid } from "services/firebase";
import { formatCurrency, formatInteger, interpolateString } from "services/formatter";
import { getCurrencyType } from "services/locale";
import { checkDataToCheck, itemStateToItem } from "services/transformer";

export type CheckActionButtonProps = Pick<BaseProps, "strings"> & {
  checkId: string;
  onShareClick: CheckSettingsProps["onShareClick"];
  setCheckData: Dispatch<SetStateAction<CheckDataForm>>;
  writeAccess: boolean;
};

export const CheckActionButton = memo((props: CheckActionButtonProps) => {
  const { setSnackbar } = useSnackbar();
  const router = useRouter();
  const locale = router.locale ?? router.defaultLocale!;
  const currency = getCurrencyType(locale);

  const handleAddContributorClick = useCallback(async () => {
    try {
      if (props.writeAccess) {
        props.setCheckData((stateCheckData) => {
          // Must shallow copy contributors for memo dependencies that rely on checkData.contributors explicitly
          const newContributors = [...stateCheckData.contributors];
          const newItems = [...stateCheckData.items];
          newContributors.push({
            id: generateUid(),
            name: interpolateString(props.strings["contributorIndex"], {
              index: (stateCheckData.contributors.length + 1).toString(),
            }),
          });
          newItems.forEach((item) => {
            item.split.push(formatInteger(locale, 0));
          });

          const checkDoc = doc(db, "checks", props.checkId);
          const newStateCheckData = { items: newItems, contributors: newContributors };
          const docCheckData = checkDataToCheck(newStateCheckData, locale, currency);
          updateDoc(checkDoc, {
            ...docCheckData,
            updatedAt: Date.now(),
          });

          return newStateCheckData;
        });
      }
    } catch (err) {
      setSnackbar({
        active: true,
        message: err,
        type: "error",
      });
    }
  }, [currency, locale, props.writeAccess]);

  const handleAddItemClick = useCallback(async () => {
    try {
      if (props.writeAccess) {
        props.setCheckData((stateCheckData) => {
          const newItems = [...stateCheckData.items];
          newItems.push({
            buyer: 0,
            cost: formatCurrency(locale, 0),
            id: generateUid(),
            name: interpolateString(props.strings["itemIndex"], {
              index: (stateCheckData.items.length + 1).toString(),
            }),
            split: stateCheckData.contributors.map(() => formatInteger(locale, 1)),
          });

          const checkDoc = doc(db, "checks", props.checkId);
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
  }, [currency, locale, props.writeAccess]);

  return (
    <ActionButton
      Icon={!props.writeAccess ? Share : undefined}
      label={props.writeAccess ? props.strings["addItem"] : props.strings["share"]}
      onClick={props.writeAccess ? handleAddItemClick : props.onShareClick}
      subActions={
        props.writeAccess
          ? [
              {
                Icon: PersonAdd,
                label: props.strings["addContributor"],
                onClick: handleAddContributorClick,
              },
              {
                Icon: Share,
                label: props.strings["share"],
                onClick: props.onShareClick,
              },
            ]
          : undefined
      }
    />
  );
});

CheckActionButton.displayName = "CheckActionButton";
