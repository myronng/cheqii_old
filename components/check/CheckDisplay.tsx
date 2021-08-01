import { styled } from "@material-ui/core/styles";
import { StyledProps } from "declarations";

export const CheckDisplay = styled((props: StyledProps) => {
  return (
    <div className={`Grid-container ${props.className}`}>
      <div className="Grid-item">Item</div>
      <div className="Grid-cost">Cost</div>
      <div className="Grid-paidBy">Paid By</div>
      <div className="Grid-user">Myron</div>
      <div className="Grid-user">Shanna</div>
      <div className="Grid-item">This is a test item</div>
      <div className="Grid-cost">$400.00</div>
      <div className="Grid-paidBy">Myron</div>
      <div className="Grid-user">1</div>
      <div className="Grid-user">1</div>
      <div className="Grid-item">Another test item</div>
      <div className="Grid-cost">$300.00</div>
      <div className="Grid-paidBy">Shanna</div>
      <div className="Grid-user">1</div>
      <div className="Grid-user">2</div>
      <div className="Grid-item">My ABCs</div>
      <div className="Grid-cost">$200.00</div>
      <div className="Grid-paidBy">Shanna</div>
      <div className="Grid-user">2</div>
      <div className="Grid-user">2</div>
      <div className="Grid-item">Last item</div>
      <div className="Grid-cost">$600.00</div>
      <div className="Grid-paidBy">Myron</div>
      <div className="Grid-user">4</div>
      <div className="Grid-user">3</div>
    </div>
  );
})`
  ${({ theme }) => `
    display: grid;
    font-family: Fira Code;
    gap: ${theme.spacing(2, 4)};
    grid-template-areas:
      "header header header header header"
      "item cost paidBy user user";
    grid-template-columns: [item] minmax(300px, 5fr) [cost] 1fr [paidBy] 1fr [names] repeat(2, 1fr);
    padding: ${theme.spacing(2, 4)};

    & .Grid-cost {
      text-align: right;
    }

    & .Grid-paidBy {
    }

    & .Grid-user {
      text-align: right;
    }
  `}
`;
