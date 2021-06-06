import { experimentalStyled as styled } from "@material-ui/core/styles";
import { NextPage } from "next";

interface PageProps {
  className?: string;
}

const Page: NextPage = styled((props: PageProps) => {
  return <main className={props.className}></main>;
})``;

export default Page;
