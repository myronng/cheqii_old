import { CloudOff } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { StackError as UnstyledStackError } from "components/ErrorBoundary";

const StackError = styled(UnstyledStackError)`
  & .Error-body {
    border-radius: 50%;

    & .MuiSvgIcon-root {
      display: block;
      font-size: 128px;
      padding: 16px;
    }
  }
`;

const Page = () => <StackError message={<CloudOff />} />;

export default Page;
