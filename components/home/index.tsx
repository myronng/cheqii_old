import { AddTask, Warning } from "@mui/icons-material";
import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useAuth } from "components/AuthContextProvider";
import { Header } from "components/Header";
import { CheckPreview } from "components/home/CheckPreview";
import { InsertSlot } from "components/home/CheckPreview/InsertSlot";
import { Skeleton } from "components/home/CheckPreview/Skeleton";
import { Slot } from "components/home/CheckPreview/Slot";
import { Page, Paginator, PaginatorProps } from "components/home/Page";
import { useLoading } from "components/LoadingContextProvider";
import { useSnackbar } from "components/SnackbarContextProvider";
import { BaseProps, Check } from "declarations";
import { collection, documentId, getDocs, query, where } from "firebase/firestore";
import { useRouter } from "next/router";
import homeTextureDark from "public/static/homeTexture-dark.svg";
import homeTextureLight from "public/static/homeTexture-light.svg";
import { ReactNode, useState } from "react";
import { CHECKS_PER_PAGE } from "services/constants";
import { db } from "services/firebase";
import { getLocale } from "services/locale";

export type CheckPreviewType = {
  data: Check;
  id: string;
};

export type HomePageProps = Pick<BaseProps, "className" | "strings"> & {
  allCheckIds: string[];
  checks: CheckPreviewType[];
};

export const HomePage = styled((props: HomePageProps) => {
  const router = useRouter();
  const { userInfo } = useAuth();
  const { loading, setLoading } = useLoading();
  const { setSnackbar } = useSnackbar();
  const numericPageQuery = Number(router.query.page);
  const [animatedPageNumber, setAnimatedPageNumber] = useState(
    !Number.isNaN(numericPageQuery) && numericPageQuery > 1 ? numericPageQuery : 1
  );
  const [checks, setChecks] = useState(props.checks);
  const locale = getLocale(router);
  const dateFormatter = Intl.DateTimeFormat(locale, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    hour12: false,
    year: "numeric",
  });
  const totalCheckCount = props.allCheckIds.length;
  const totalPageCount = totalCheckCount === 0 ? 1 : Math.ceil(totalCheckCount / CHECKS_PER_PAGE);
  const disablePagination = userInfo?.isAnonymous || loading.active || totalPageCount <= 1;
  const renderPages: ReactNode[] = [];

  const handlePageChange: PaginatorProps["onChange"] = async (_e, nextPageNumber) => {
    try {
      setLoading({ active: true });
      setAnimatedPageNumber(nextPageNumber);
      const startBound = (nextPageNumber - 1) * CHECKS_PER_PAGE;
      const endBound = startBound + CHECKS_PER_PAGE;
      const newCheckIds = props.allCheckIds.slice(startBound, endBound || undefined); // undefined handles going back to first page
      if (newCheckIds.length > 0) {
        const checkOrder: Record<string, number> = {};
        newCheckIds.forEach((newCheck, index) => {
          checkOrder[newCheck] = startBound + index;
        });
        const newCheckData = await getDocs(
          query(collection(db, "checks"), where(documentId(), "in", newCheckIds))
        );
        const newChecks = [...checks];
        newCheckData.forEach((check) => {
          const checkData = check.data() as Check;
          newChecks[checkOrder[check.id]] = {
            data: checkData,
            id: check.id,
          };
        });
        setChecks(newChecks);
      }
      router.push(`/p/${nextPageNumber}`);
    } catch (err) {
      setSnackbar({
        active: true,
        message: err,
        type: "error",
      });
    } finally {
      setLoading({ active: false });
    }
  };
  let renderInsertText;
  let insertIsDisabled = false;
  if (userInfo?.isAnonymous && props.allCheckIds.length >= CHECKS_PER_PAGE) {
    insertIsDisabled = true;
    renderInsertText = (
      <>
        <Warning fontSize="large" />
        <Typography component="h2" variant="h6">
          {props.strings["anonymousMaximumLimitChecks"]}
        </Typography>
      </>
    );
  } else {
    renderInsertText = (
      <>
        <AddTask fontSize="large" />
        <Typography component="h2" variant="h5">
          {props.strings["newCheck"]}
        </Typography>
      </>
    );
  }

  for (let i = 0; i < totalPageCount; i++) {
    const iteratedChecks = i * CHECKS_PER_PAGE;
    const pageContent = [
      <InsertSlot disabled={insertIsDisabled} key={iteratedChecks} strings={props.strings}>
        {renderInsertText}
      </InsertSlot>,
    ];
    const pageChecks = checks.slice(iteratedChecks, (i + 1) * CHECKS_PER_PAGE);
    for (let j = 0; j < CHECKS_PER_PAGE; j++) {
      const check = pageChecks[j];
      if (check) {
        pageContent.push(
          <CheckPreview
            data={check.data}
            dateFormatter={dateFormatter}
            id={check.id}
            key={check.id}
            strings={props.strings}
          />
        );
      } else if (iteratedChecks + j < totalCheckCount) {
        pageContent.push(<Skeleton key={iteratedChecks + j + 1} />);
      } else {
        pageContent.push(<Slot key={iteratedChecks + j + 1} />);
      }
    }
    renderPages.push(<Page key={i}>{pageContent}</Page>);
  }

  return (
    <div className={props.className}>
      <Header strings={props.strings} title={props.strings["applicationTitle"]} />
      <main className="Body-root">
        <Paginator
          className="CheckPreview-root"
          disablePagination={disablePagination}
          onChange={handlePageChange}
          openedPage={animatedPageNumber}
        >
          {renderPages}
        </Paginator>
      </main>
    </div>
  );
})`
  ${({ theme }) => `
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    width: 100%;

    & .Body-root {
      background-color: ${theme.palette.background.secondary};
      background-image: url("${
        theme.palette.mode === "dark" ? homeTextureDark.src : homeTextureLight.src
      }");
      background-repeat: repeat;
      border-top: 2px solid ${theme.palette.secondary[theme.palette.mode]};
      display: flex;
      flex: 1;
      flex-direction: column;
      overflow: auto;
    }

    & .Page-root {
      display: grid;
      gap: ${theme.spacing(2)};

      ${theme.breakpoints.up("xs")} {
        grid-template-columns: 1fr;
      }
      ${theme.breakpoints.up("sm")} {
        grid-template-columns: 1fr 1fr;
      }
      ${theme.breakpoints.up("md")} {
        grid-template-columns: 1fr 1fr 1fr;
        // grid-template-columns: minmax(max-content, 1fr) minmax(max-content, 1fr)  minmax(max-content, 1fr);
      }
    }
  `}
`;

HomePage.displayName = "HomePage";
