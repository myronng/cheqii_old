import { Dialog, DialogContent, DialogProps, DialogTitle } from "@material-ui/core";
import { styled } from "@material-ui/core/styles";
import { ValidateForm, ValidateTextField } from "components/ValidateForm";
import { StyledProps } from "declarations";

export type ShareDialogProps = StyledProps & DialogProps;

export const ShareDialog = styled((props: ShareDialogProps) => {
  return (
    <Dialog
      className={`ShareDialog-root ${props.className}`}
      onClose={props.onClose}
      open={props.open}
    >
      <DialogTitle className="ShareDialog-title">Share</DialogTitle>
      <DialogContent className="ShareDialog-content">
        <ValidateForm className="ShareDialog-form">
          <ValidateTextField className="ShareDialog-email" label="Email" type="email" />
        </ValidateForm>
      </DialogContent>
    </Dialog>
  );
})`
  ${({ theme }) => `
    & .ShareDialog-form {
      padding-top: ${theme.spacing(1)};
    }
  `}
`;
