import { GitHub } from "@material-ui/icons";
import { GetServerSideProps, NextPage } from "next";

interface Props {}

const Page: NextPage<Props> = (props) => {
  return (
    <div>
      <GitHub />
      test
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    props: {},
  };
};

export default Page;
