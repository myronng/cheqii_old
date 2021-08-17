import { useRouter } from "next/router";
import currencyMapping from "locales/currency.json";

export const useCurrencyFormat = () => {
  const router = useRouter();
  const currencyFormatter = new Intl.NumberFormat(router.locale, {
    currency: currencyMapping[router.locale as keyof typeof currencyMapping],
    currencyDisplay: "narrowSymbol",
    style: "currency",
  });

  return (value: string) => {
    const numericValue = Number(value);
    return !Number.isNaN(numericValue) && Number.isFinite(numericValue)
      ? currencyFormatter.format(numericValue)
      : value.toString();
  };
};

export const useIntegerFormat = () => {
  const router = useRouter();
  const integerFormatter = new Intl.NumberFormat(router.locale, {
    maximumFractionDigits: 0,
    style: "decimal",
  });

  return (value: string) => {
    const numericValue = Number(value);
    return !Number.isNaN(numericValue) && Number.isFinite(numericValue)
      ? integerFormatter.format(numericValue)
      : value.toString();
  };
};

export const useStripNumberFormat = () => {
  const router = useRouter();
  const currencyFormatter = new Intl.NumberFormat(router.locale, {
    currency: currencyMapping[router.locale as keyof typeof currencyMapping],
    currencyDisplay: "narrowSymbol",
    style: "currency",
  });

  // Use currency formatter with 5 digits to get all known permutations of number formatting
  const parts = currencyFormatter.formatToParts(11111.1);
  return (value: string) => {
    for (const part of parts) {
      if (
        part.type === "currency" ||
        part.type === "group" ||
        part.type === "literal" ||
        part.type === "percentSign" ||
        part.type === "unit"
      ) {
        value = value.replace(new RegExp(`\\${part.value}`, "g"), "");
      } else if (part.type === "decimal") {
        value = value.replace(new RegExp(`\\${part.value}`), ".");
      }
    }
    const numericValue = Number(value);
    if (!Number.isNaN(numericValue) && Number.isFinite(numericValue)) {
      return numericValue;
    } else {
      return 0;
    }
  };
};
