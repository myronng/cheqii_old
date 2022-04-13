import { Check, CheckDataForm, CheckDataServer } from "declarations";
import { Currency } from "dinero.js";
import { formatCurrency, formatInteger } from "services/formatter";
import { parseCurrencyAmount, parseRatioAmount } from "services/parser";

export const checkToCheckData: (locale: string, check: Check) => CheckDataForm = (
  locale,
  { contributors, items, title }
) => {
  const checkForm: CheckDataForm = {
    contributors: contributors.map(({ name, ...contributor }) => ({
      ...contributor,
      name: {
        clean: name,
        dirty: name,
      },
    })),
    items: items.map(({ buyer, cost, name, split, ...item }) => {
      const newCost = formatCurrency(locale, cost);
      return {
        ...item,
        buyer: {
          clean: buyer,
          dirty: buyer,
        },
        cost: {
          clean: newCost,
          dirty: newCost,
        },
        name: {
          clean: name,
          dirty: name,
        },
        split: split.map((amount) => {
          const newSplit = formatInteger(locale, amount);
          return {
            clean: newSplit,
            dirty: newSplit,
          };
        }),
      };
    }),
    title: {
      clean: title,
      dirty: title,
    },
  };
  return checkForm;
};

export const checkDataToCheck: (
  locale: string,
  currency: Currency<number>,
  checkData: CheckDataForm
) => CheckDataServer = (locale, currency, { contributors, items, title }) => {
  const check: CheckDataServer = {
    contributors: contributors.map(({ name, ...contributor }) => ({
      ...contributor,
      name: name.dirty,
    })),
    items: items.map(({ buyer, cost, name, split, ...item }) => ({
      ...item,
      buyer: buyer.dirty,
      cost: parseCurrencyAmount(locale, currency, cost.dirty),
      name: name.dirty,
      split: split.map((amount) => parseRatioAmount(locale, amount.dirty)),
    })),
    title: title.dirty,
  };
  return check;
};
