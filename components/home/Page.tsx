import { Pagination, PaginationProps, Slide, SlideProps, Typography } from "@mui/material";
import { styled } from "@mui/system";
import { BaseProps } from "declarations";
import { Children, cloneElement, isValidElement, ReactElement, useRef } from "react";

type AnimationHandler = (node: HTMLElement) => void;

export type PageProps = Pick<BaseProps, "children" | "className"> & {
  SlideProps: SlideProps;
};

export type PaginatorProps = Pick<BaseProps, "children" | "className"> & {
  disablePagination?: boolean;
  hint?: string;
  onChange: PaginationProps["onChange"];
  openedPage: number;
};

export const Page = styled((props: any) => {
  const handleAnimating: AnimationHandler = (node) => {
    node.classList.toggle("Page-animating", true);
  };

  const handleAnimated: AnimationHandler = (node) => {
    node.classList.toggle("Page-animating", false);
  };

  return (
    <Slide
      appear={false}
      direction={props.direction}
      in={props.in}
      onExit={handleAnimating}
      onExited={handleAnimated}
      unmountOnExit
      {...props.SlideProps}
    >
      <section className={`Page-root ${props.className}`}>{props.children}</section>
    </Slide>
  );
})`
  &.Page-animating {
    bottom: 0;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
  }
`;

export const Paginator = styled((props: PaginatorProps) => {
  const currentPage = useRef<number>(props.openedPage);
  const nextPage = useRef<number>(props.openedPage);
  let numberOfPages = 0;

  const children = Children.map(props.children, (child, index) => {
    let renderChild;
    if (isValidElement(child)) {
      const isIn = index === props.openedPage - 1;
      let direction: SlideProps["direction"];
      if (isIn) {
        if (nextPage.current > currentPage.current) {
          direction = "left";
        } else {
          direction = "right";
        }
      } else {
        if (nextPage.current > currentPage.current) {
          direction = "right";
        } else {
          direction = "left";
        }
      }
      renderChild = cloneElement(child as ReactElement, {
        SlideProps: {
          direction: child.props.direction ?? direction,
          in: child.props.in ?? isIn,
        },
      });
    } else {
      renderChild = null;
    }
    numberOfPages++;
    return renderChild;
  });

  const handleChange: PaginationProps["onChange"] = async (e, nextPageNumber) => {
    currentPage.current = nextPage.current;
    nextPage.current = nextPageNumber;
    const root = (e.target as HTMLButtonElement).closest(".Paginator-root");
    if (root !== null) {
      root.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (nextPageNumber !== props.openedPage && typeof props.onChange === "function") {
      props.onChange(e, nextPageNumber);
    }
  };

  return (
    <div className={`Paginator-root ${props.className}`}>
      <div className="Paginator-container">{children}</div>
      <div className="Paginator-pagination">
        <Pagination
          color="primary"
          count={numberOfPages}
          disabled={props.disablePagination}
          onChange={handleChange}
          page={props.openedPage}
          size="large"
          variant="outlined"
        />
        {props.hint && (
          <Typography color="warning.main" component="span" variant="subtitle2">
            {props.hint}
          </Typography>
        )}
      </div>
    </div>
  );
})`
  ${({ theme }) => `
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow-x: hidden;
    overflow-y: auto;
    padding: ${theme.spacing(2)};

    & .MuiPagination-root {
      flex-shrink: 0;
    }

    & .Paginator-container {
      // Use margin instead of justify-content at parent to prevent overflow issues
      margin: auto 0;
      position: relative; // Prevents overflow when animating
    }

    & .Paginator-pagination {
      align-items: center;
      display: flex;
      grid-column: 1 / -1; // Only works for statically-defined grids
      justify-content: space-between;
      margin: ${theme.spacing(3, 0, 1, 0)};

      & .MuiTypography-root {
        margin-left: ${theme.spacing(2)};
      }
    }
  `}
`;

Page.displayName = "Page";
Paginator.displayName = "Paginator";
