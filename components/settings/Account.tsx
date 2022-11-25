import { ManageAccounts } from "@mui/icons-material";
import { List, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
// import { useAuth } from "components/AuthContextProvider";
import { redirect } from "components/Link";
import { ListItem } from "components/List";
import { useLoading } from "components/LoadingContextProvider";
import { useSnackbar } from "components/SnackbarContextProvider";
import { ValidateForm } from "components/ValidateForm";
import { BaseProps } from "declarations";
import { MouseEventHandler } from "react";

type AccountProps = Pick<BaseProps, "className" | "strings">;

export const Account = styled((props: AccountProps) => {
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();
  // const { userInfo } = useAuth();

  const handleDeleteAccountClick: MouseEventHandler<HTMLButtonElement> = async (_e) => {
    try {
      setLoading({
        active: true,
        id: "accountDelete",
      });
      const response = await fetch("/api/user", {
        method: "DELETE",
      });
      if (response.ok) {
        redirect(setLoading, "/");
      }
    } catch (err) {
      setSnackbar({
        active: true,
        message: err,
        type: "error",
      });
      setLoading({
        active: false,
        id: "accountDelete",
      });
    }
  };

  // const handleFormSubmit: ValidateFormProps["onSubmit"] = async (_e) => {
  //   try {
  //     setLoading({
  //       active: true,
  //       id: "accountSubmit",
  //     });
  //     if (userInfo.uid) {
  //       // await updateDoc(doc(db, "users", userInfo.uid), {
  //       //   invite: {
  //       //     required: inviteRequired,
  //       //     type: inviteType.id,
  //       //   },
  //       //   updatedAt: Date.now(),
  //       // });
  //     }
  //   } catch (err) {
  //     setSnackbar({
  //       active: true,
  //       message: err,
  //       type: "error",
  //     });
  //   } finally {
  //     setLoading({
  //       active: false,
  //       id: "accountSubmit",
  //     });
  //   }
  // };

  return (
    // <ValidateForm className={`Account-root ${props.className}`} onSubmit={handleFormSubmit}>
    <ValidateForm className={`Account-root ${props.className}`}>
      <Typography className="Account-heading" component="h2" variant="h2">
        <ManageAccounts fontSize="inherit" />
        <span>{props.strings["account"]}</span>
      </Typography>
      <List>
        <ListItem
          ListItemButtonProps={{
            disabled: loading.active,
            onClick: handleDeleteAccountClick,
          }}
          ListItemTextProps={{
            primary: props.strings["deleteAccount"],
            primaryTypographyProps: { color: "error.main" },
            secondary: props.strings["deleteAccountHint"],
          }}
        />
      </List>
    </ValidateForm>
  );
})`
  ${({ theme }) => `
    & .MuiList-root {
      background: ${theme.palette.action.hover};
      border-radius: ${theme.shape.borderRadius}px;
      overflow: hidden;
      padding: 0;
    }

    & .Account-heading {
      align-items: center;
      display: flex;

      & .MuiSvgIcon-root {
        margin-right: ${theme.spacing(2)};
      }
    }
  `}
`;

Account.displayName = "Account";
