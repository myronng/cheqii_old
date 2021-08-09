import { styled } from "@material-ui/core/styles";
import { StyledProps } from "declarations";

export const CheckDisplay = styled((props: StyledProps) => {
  return (
    <div className={`Grid-container ${props.className}`}>
      <div className="Grid-item">Item</div>
      <div className="Grid-cost">Cost</div>
      <div className="Grid-payer">Payer</div>
      <div className="Grid-user">Myron</div>
      <div className="Grid-user">Shanna</div>
      <div className="Grid-item">
        This is a test
        itemaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
      </div>
      <div className="Grid-cost">$400.00</div>
      <div className="Grid-payer">Myron</div>
      <div className="Grid-user">1</div>
      <div className="Grid-user">1</div>
      <div className="Grid-item">Another test item</div>
      <div className="Grid-cost">$300.00</div>
      <div className="Grid-payer">Shanna</div>
      <div className="Grid-user">1</div>
      <div className="Grid-user">2</div>
      <div className="Grid-item">My ABCs</div>
      <div className="Grid-cost">$200.00</div>
      <div className="Grid-payer">Shanna</div>
      <div className="Grid-user">2</div>
      <div className="Grid-user">2</div>
      <div className="Grid-item">Last item</div>
      <div className="Grid-cost">$600.00</div>
      <div className="Grid-payer">Myron</div>
      <div className="Grid-user">4</div>
      <div className="Grid-user">3</div>
    </div>
  );
})`
  ${({ theme }) => `
    align-items: center;
    display: inline-grid;
    font-family: Fira Code;
    gap: ${theme.spacing(2, 4)};
    grid-template-columns: minmax(0, 1fr) auto auto repeat(2, auto);
    padding: ${theme.spacing(2, 4)};

    & .Grid-cost {
      text-align: right;
    }

    & .Grid-item {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: pre-line;
    }

    & .Grid-payer {
    }

    & .Grid-user {
      text-align: right;
    }
  `}
`;
