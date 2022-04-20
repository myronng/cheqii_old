import { Check, CheckDataForm, CheckDataServer, CheckSettings } from "declarations";
import { Currency } from "dinero.js";
import { formatCurrency, formatInteger } from "services/formatter";
import { parseCurrencyAmount, parseRatioAmount } from "services/parser";

type CheckDataToCheck = (
  checkData: CheckDataForm,
  locale: string,
  currency: Currency<number>
) => CheckDataServer;

type CheckToCheckStates = (
  check: Check,
  locale: string
) => { checkData: CheckDataForm; checkSettings: CheckSettings };

type ContributorStateToContributor = (
  contributors: CheckDataForm["contributors"]
) => CheckDataServer["contributors"];

type ItemStateToItem = (
  items: CheckDataForm["items"],
  locale: string,
  currency: Currency<number>
) => CheckDataServer["items"];

export const checkDataToCheck: CheckDataToCheck = ({ contributors, items }, locale, currency) => {
  const check: CheckDataServer = {
    contributors: contributorStateToContributor(contributors),
    items: itemStateToItem(items, locale, currency),
  };
  return check;
};

export const checkToCheckStates: CheckToCheckStates = (
  { contributors, items, updatedAt, ...checkSettings },
  locale
) => {
  const checkData: CheckDataForm = {
    contributors: contributors,
    items: items.map(({ cost, split, ...item }) => ({
      ...item,
      cost: formatCurrency(locale, cost),
      split: split.map((amount) => formatInteger(locale, amount)),
    })),
  };
  return {
    checkData,
    checkSettings,
  };
};

export const contributorStateToContributor: ContributorStateToContributor = (contributors) =>
  contributors.map(({ name, ...contributor }) => ({
    ...contributor,
    name: name,
  }));

export const itemStateToItem: ItemStateToItem = (items, locale, currency) =>
  items.map(({ cost, split, ...item }) => ({
    ...item,
    cost: parseCurrencyAmount(locale, currency, cost),
    split: split.map((amount) => parseRatioAmount(locale, amount)),
  }));
