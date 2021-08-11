import { ButtonBase, InputBase, Menu, MenuItem } from "@material-ui/core";
import { styled } from "@material-ui/core/styles";
import { Check, StyledProps } from "declarations";
import { useRouter } from "next/router";
import { ChangeEvent, Fragment, MouseEvent, MouseEventHandler, useState } from "react";

export type CheckDisplayProps = StyledProps & {
  contributors: NonNullable<Check["contributors"]>;
  items: NonNullable<Check["items"]>;
  onBuyerChange: (
    event: MouseEvent<HTMLLIElement>,
    contributorIndex: number,
    itemIndex: number
  ) => void;
  onContributionChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    contributionIndex: number,
    itemIndex: number
  ) => void;
  onContributorChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    contributorIndex: number
  ) => void;
};

export const CheckDisplay = styled((props: CheckDisplayProps) => {
  const router = useRouter();
  const [buyerAnchorEl, setBuyerAnchorEl] = useState(null as HTMLButtonElement | null);
  const [buyerItemIndex, setBuyerItemIndex] = useState(-1);
  const buyerMenuOpen = Boolean(buyerAnchorEl);
  const formatter = new Intl.NumberFormat(router.locales, {
    currency: "CAD",
    currencyDisplay: "narrowSymbol",
    style: "currency",
  });

  const handleBuyerClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    setBuyerAnchorEl(e.currentTarget);
    setBuyerItemIndex(Number(e.currentTarget.dataset.index));
  };

  const handleBuyerClose = () => {
    setBuyerAnchorEl(null);
    setBuyerItemIndex(-1);
  };

  const buyerMenuItems: JSX.Element[] = [];
  const gridContributers = props.contributors.map((contributor, index) => {
    buyerMenuItems.push(
      <MenuItem
        disabled={props.items[buyerItemIndex]?.buyer === index}
        key={index}
        onClick={(e) => {
          props.onBuyerChange(e, index, buyerItemIndex);
          handleBuyerClose();
        }}
      >
        {contributor}
      </MenuItem>
    );
    return (
      <InputBase
        inputProps={{
          className: "Grid-numeric",
          style: {
            width: `calc(${contributor.length}ch + 1px)`,
          },
        }}
        key={index}
        onChange={(e) => {
          props.onContributorChange(e, index);
        }}
        value={contributor}
      />
    );
  });

  return (
    <>
      <div className={`Grid-container ${props.className}`}>
        <div className="Grid-header">Item</div>
        <div className="Grid-header Grid-numeric">Cost</div>
        <div className="Grid-header Grid-buttonHeader">Buyer</div>
        {gridContributers}
        {props.items.map((item, itemIndex) => (
          <Fragment key={itemIndex}>
            <div className="Grid-item">{item.name}</div>
            <div className="Grid-numeric">{formatter.format(item.cost || 0)}</div>
            <ButtonBase className="Grid-buyer" data-index={itemIndex} onClick={handleBuyerClick}>
              {typeof item.buyer !== "undefined" ? props.contributors[item.buyer] : ""}
            </ButtonBase>
            {item.split?.map((contribution, contributionIndex) => (
              <InputBase
                className="Grid-numeric"
                inputProps={{
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                  style: {
                    width: `calc(${contribution.toString().length}ch + 1px)`,
                  },
                }}
                key={contributionIndex}
                onChange={(e) => {
                  props.onContributionChange(e, contributionIndex, itemIndex);
                }}
                value={contribution}
              />
              // <div className="Grid-contributor" key={index}>
              //   {contribution}
              // </div>
            ))}
          </Fragment>
        ))}
      </div>
      <Menu anchorEl={buyerAnchorEl} onClose={handleBuyerClose} open={buyerMenuOpen}>
        {buyerMenuItems}
      </Menu>
    </>
  );
})`
  ${({ contributors = [], theme }) => `
    align-items: center;
    display: inline-grid;
    font-family: Fira Code;
    gap: ${theme.spacing(1.5, 4)};
    grid-template-columns: minmax(0, 1fr) auto auto repeat(${contributors.length}, auto);
    min-width: 768px;
    padding: ${theme.spacing(2, 4)};
    width: 100%;

    & .Grid-buttonHeader {
      margin: ${theme.spacing(0, 1)};
    }

    & .Grid-buyer {
      border-radius: ${theme.shape.borderRadius}px;
      font: inherit;
      margin-right: auto;
      padding: ${theme.spacing(0.5, 1)};
    }

    & .Grid-header {
      color: ${theme.palette.action.disabled};
    }

    & .Grid-numeric {
      justify-content: flex-end;
      text-align: right;
    }

    & .Grid-item {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: pre-line;
    }

    & .MuiInputBase-root {
      font: inherit;

      & .MuiInputBase-input {
        font: inherit;
        padding: 0;
      }
    }

  `}
`;
