import { styled } from "@material-ui/core/styles";
import { ChangeEvent, DetailedHTMLProps, SelectHTMLAttributes } from "react";

export type SelectProps = DetailedHTMLProps<
  SelectHTMLAttributes<HTMLSelectElement>,
  HTMLSelectElement
> & {
  options: string[];
};

export const Select = styled(({ className, defaultValue, options, ...props }: SelectProps) => {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    e.target.dataset.value = e.target.selectedIndex.toString();
    if (typeof props.onChange === "function") {
      props.onChange(e);
    }
  };

  return (
    <select
      {...props}
      className={`Select-root ${className}`}
      data-value={defaultValue}
      defaultValue={defaultValue}
      onChange={handleChange}
    >
      {options.map((option, index) => (
        <option className="Select-option" key={index} value={index}>
          {option}
        </option>
      ))}
    </select>
  );
})`
  ${({ theme }) => `
    appearance: none;
    background: none;
    border: 0;
    color: currentColor;
    font: inherit;
    height: 100%;
    padding: ${theme.spacing(0, 2)};
    text-align: inherit;

    &:focus-visible {
      outline: 2px solid ${theme.palette.primary.main};
    }

    & .Select-option {
      background: ${theme.palette.background.paper};
    }
  `}
`;
