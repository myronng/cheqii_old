import { Link } from "@mui/icons-material";
import { Badge, Button, ButtonProps } from "@mui/material";
import { Dinero } from "dinero.js";
import { useRouter } from "next/router";
import { memo, MouseEvent } from "react";
import { formatCurrency } from "services/formatter";
import { getCurrencyType, getLocale } from "services/locale";
import { parseDineroAmount, parseDineroMap } from "services/parser";

export type SummaryButtonProps = Omit<ButtonProps, "onClick"> & {
  balance: number;
  contributorIndex: number;
  linked: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>, contributorIndex: number) => void;
  totalOwing: Map<number, Dinero<number>>;
  totalPaid: Map<number, Dinero<number>>;
};

export const SummaryButton = memo(
  ({
    balance,
    contributorIndex,
    linked,
    onClick,
    totalOwing,
    totalPaid,
    ...buttonProps
  }: SummaryButtonProps) => {
    const router = useRouter();
    const locale = getLocale(router);
    const currency = getCurrencyType(locale);

    const contributorPaidDinero = parseDineroMap(currency, totalPaid, contributorIndex);
    const contributorOwingDinero = parseDineroMap(currency, totalOwing, contributorIndex);

    return (
      <Badge
        anchorOrigin={{ horizontal: "left", vertical: "top" }}
        badgeContent={linked ? <Link /> : undefined}
        className={linked ? "Grid-linked" : undefined}
        color="secondary"
      >
        <Button
          {...buttonProps}
          color="inherit"
          href="#summary"
          onClick={(e) => onClick(e, contributorIndex)}
        >
          <span className="Grid-numeric">
            {formatCurrency(locale, parseDineroAmount(contributorPaidDinero))}
          </span>
          <span className="Grid-numeric">
            {formatCurrency(locale, parseDineroAmount(contributorOwingDinero))}
          </span>
          <span className={`Grid-numeric ${balance < 0 ? "Grid-negative" : ""}`}>
            {formatCurrency(locale, balance)}
          </span>
        </Button>
      </Badge>
    );
  }
);

SummaryButton.displayName = "SummaryButton";
