import { Pagination, PaginationProps, Slide, SlideProps } from "@mui/material";
import { styled } from "@mui/system";
import { BaseProps } from "declarations";
import { ReactNode, useRef, useState } from "react";

export type PageProps = Pick<BaseProps, "className"> & {
  disablePagination?: boolean;
  onChange: PaginationProps["onChange"];
  openedPage: number;
  pages: ReactNode[];
  pagination?: ReactNode;
};

export const Page = styled((props: PageProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = useState<{
    isPrimaryRendered: boolean;
    primaryDirection?: SlideProps["direction"];
    primaryRender: ReactNode;
    secondaryDirection?: SlideProps["direction"];
    secondaryRender: ReactNode;
  }>({
    isPrimaryRendered: true,
    primaryDirection: "right",
    primaryRender: props.pages[0],
    secondaryDirection: "left",
    secondaryRender: null,
  });

  const handleAnimating = (node: HTMLElement) => {
    node.classList.toggle("Page-animating", true);
  };

  const handleAnimated = (node: HTMLElement) => {
    node.classList.toggle("Page-animating", false);
  };

  const handleChange: PaginationProps["onChange"] = async (e, nextPageNumber) => {
    if (nextPageNumber !== props.openedPage) {
      let primaryDirection: SlideProps["direction"] = undefined;
      let secondaryDirection: SlideProps["direction"] = undefined;
      let primaryRender: ReactNode;
      let secondaryRender: ReactNode;

      const pageIndex = nextPageNumber - 1;

      if (page.isPrimaryRendered) {
        primaryRender = page.primaryRender;
        secondaryRender = props.pages[pageIndex];
        if (nextPageNumber > props.openedPage) {
          primaryDirection = "right";
          secondaryDirection = "left";
        } else {
          primaryDirection = "left";
          secondaryDirection = "right";
        }
      } else {
        primaryRender = props.pages[pageIndex];
        secondaryRender = page.secondaryRender;
        if (nextPageNumber > props.openedPage) {
          primaryDirection = "left";
          secondaryDirection = "right";
        } else {
          primaryDirection = "right";
          secondaryDirection = "left";
        }
      }

      setPage({
        isPrimaryRendered: !page.isPrimaryRendered,
        primaryDirection,
        primaryRender,
        secondaryDirection,
        secondaryRender,
      });
    }

    if (typeof props.onChange === "function") {
      props.onChange(e, nextPageNumber);
    }
  };

  return (
    <section className={`Page-root ${props.className}`}>
      <div className="Page-container" ref={containerRef}>
        <Slide
          appear={false}
          container={containerRef.current}
          direction={page.primaryDirection}
          in={page.isPrimaryRendered}
          onExit={handleAnimating}
          onExited={handleAnimated}
          unmountOnExit
        >
          <div className="Page-item Page-primary">{page.primaryRender}</div>
        </Slide>
        <Slide
          appear={false}
          container={containerRef.current}
          direction={page.secondaryDirection}
          in={!page.isPrimaryRendered}
          onExit={handleAnimating}
          onExited={handleAnimated}
          unmountOnExit
        >
          <div className="Page-item Page-secondary">{page.secondaryRender}</div>
        </Slide>
      </div>
      {typeof props.pagination !== "undefined" ? (
        props.pagination
      ) : (
        <Pagination
          className="CheckPreview-pagination"
          color="primary"
          count={props.pages.length}
          disabled={props.disablePagination}
          onChange={handleChange}
          page={props.openedPage}
          size="large"
          variant="outlined"
        />
      )}
    </section>
  );
})`
  ${({ theme }) => `
    overflow-x: hidden;
    overflow-y: auto;
    padding: ${theme.spacing(2)};

    & .Page-container {
      display: flex;
      position: relative; // Prevents overflow when animating
    }

    & .Page-animating {
      position: absolute;
    }
  `}
`;
