import { Button, ButtonProps } from "@mui/material";
import { Dinero, subtract } from "dinero.js";
import { useRouter } from "next/router";
import { memo, MouseEvent } from "react";
import { formatCurrency } from "services/formatter";
import { getCurrencyType } from "services/locale";
import { parseDineroAmount, parseDineroMap } from "services/parser";

export type SummaryButtonProps = Omit<ButtonProps, "onClick"> & {
  contributorIndex: number;
  onClick: (event: MouseEvent<HTMLButtonElement>, contributorIndex: number) => void;
  totalOwing: Map<number, Dinero<number>>;
  totalPaid: Map<number, Dinero<number>>;
};

export const SummaryButton = memo(
  ({ contributorIndex, onClick, totalOwing, totalPaid, ...buttonProps }: SummaryButtonProps) => {
    const router = useRouter();
    const locale = router.locale ?? router.defaultLocale!;
    const currency = getCurrencyType(locale);

    const contributorPaidDinero = parseDineroMap(currency, totalPaid, contributorIndex);
    const contributorOwingDinero = parseDineroMap(currency, totalOwing, contributorIndex);

    return (
      <Button {...buttonProps} color="inherit" onClick={(e) => onClick(e, contributorIndex)}>
        <span className="Grid-numeric">
          {formatCurrency(locale, parseDineroAmount(contributorPaidDinero))}
        </span>
        <span className="Grid-numeric">
          {formatCurrency(locale, parseDineroAmount(contributorOwingDinero))}
        </span>
        <span className="Grid-numeric">
          {formatCurrency(
            locale,
            parseDineroAmount(subtract(contributorPaidDinero, contributorOwingDinero))
          )}
        </span>
      </Button>
    );
  }
);

SummaryButton.displayName = "SummaryButton";
