import { styled } from "@material-ui/core/styles";
import { ValidateTextField } from "components/ValidateForm";

export const TextField = styled(ValidateTextField)`
  ${({ theme }) => `
  & .MuiInputLabel-root {
    margin-left: ${theme.spacing(1)};
  }

  & .MuiInputBase-root.MuiInputBase-adornedStart {
    & .MuiInputBase-input {
      border-bottom-left-radius: 0;
      border-top-left-radius: 0;
    }

    & .MuiOutlinedInput-notchedOutline legend {
      margin-left: ${theme.spacing(1)};
    }

    & .MuiSvgIcon-root {
      margin: 0 ${theme.spacing(1)};
    }
  }
`}
`;
