import { experimentalStyled as styled } from "@material-ui/core/styles";
import { ValidateTextField } from "components/ValidateForm";

export const TextField = styled(ValidateTextField)`
  ${({ theme }) => `
  & .MuiInputLabel-root {
    margin-left: ${theme.spacing(1)};
  }

  & .MuiInputBase-root.MuiInputBase-adornedStart {
    ${theme.breakpoints.up("xs")} {
      height: 48px;
    }
    ${theme.breakpoints.up("md")} {
      height: 64px;
    }


    & .MuiInputBase-input {
      border-bottom-left-radius: 0;
      border-top-left-radius: 0;

      ${theme.breakpoints.up("xs")} {
        padding: 12px ${theme.spacing(1)};
      }
      ${theme.breakpoints.up("md")} {
        padding: 20px ${theme.spacing(1)};
      }
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
