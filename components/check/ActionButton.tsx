import {
  Collapse,
  SpeedDial,
  SpeedDialAction,
  SpeedDialProps,
  Typography,
} from "@material-ui/core";
import { styled, useTheme } from "@material-ui/core/styles";
import { Add, PersonAdd, Share } from "@material-ui/icons";
import { Check, StyledProps } from "declarations";
import { MouseEventHandler, useState } from "react";

export type ActionButtonProps = StyledProps & {
  checkId: Check["id"];
  onClick: MouseEventHandler<HTMLButtonElement>;
};

const FAB_ACTIONS = [
  {
    icon: PersonAdd,
    name: "Add Contributor",
  },
  {
    icon: Share,
    name: "Share",
  },
];
const FAB_ACTIONS_LENGTH = FAB_ACTIONS.length;
const FAB_ANIMATION_DELAY = 30;

export const ActionButton = styled((props: ActionButtonProps) => {
  const [actionButtonOpen, setActionButtonOpen] = useState(false);
  const theme = useTheme();

  const handleActionButtonClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    if (typeof props.onClick === "function") {
      props.onClick(e);
    }
  };
  const handleActionButtonClose: SpeedDialProps["onClose"] = (_e, reason) => {
    if (reason !== "toggle") {
      setActionButtonOpen(false);
    }
  };
  const handleActionButtonOpen: SpeedDialProps["onOpen"] = (_e, reason) => {
    if (reason !== "toggle") {
      setActionButtonOpen(true);
    }
  };

  return (
    <SpeedDial
      ariaLabel="New Check"
      className={`ActionButton-root ${props.className}`}
      FabProps={{ color: "primary", onClick: handleActionButtonClick, variant: "extended" }}
      icon={
        <>
          <Add className="ActionButton-icon" />
          <Collapse
            in={actionButtonOpen}
            orientation="horizontal"
            style={{
              transitionDelay: actionButtonOpen
                ? "0ms"
                : `${FAB_ACTIONS_LENGTH * FAB_ANIMATION_DELAY}ms`,
            }}
            timeout={theme.transitions.duration.shorter}
          >
            <Typography className="ActionButton-text" variant="body2">
              Add Item
            </Typography>
          </Collapse>
        </>
      }
      onClose={handleActionButtonClose}
      onOpen={handleActionButtonOpen}
      open={actionButtonOpen}
    >
      {FAB_ACTIONS.map((action, index) => {
        return (
          <SpeedDialAction
            className="SubActionButton-root"
            FabProps={{
              size: "medium",
              variant: "extended",
            }}
            icon={
              <>
                <action.icon className="ActionButton-icon" />
                <Collapse
                  in={actionButtonOpen}
                  orientation="horizontal"
                  style={{
                    transitionDelay: actionButtonOpen
                      ? `${index * FAB_ANIMATION_DELAY}ms`
                      : `${(FAB_ACTIONS_LENGTH - index) * FAB_ANIMATION_DELAY}ms`,
                  }}
                  timeout={
                    actionButtonOpen
                      ? theme.transitions.duration.shorter
                      : theme.transitions.duration.shortest
                  }
                >
                  <Typography className="ActionButton-text" variant="body2">
                    {action.name}
                  </Typography>
                </Collapse>
              </>
            }
            key={index}
            tooltipOpen // Used for MuiSpeedDialAction-staticTooltipLabel class
          />
        );
      })}
    </SpeedDial>
  );
})`
  ${({ theme }) => `
    align-items: flex-end;
    bottom: ${theme.spacing(4)};
    position: absolute;
    right: ${theme.spacing(4)};

    & .ActionButton-text {
      margin-left: ${theme.spacing(1)};
      white-space: nowrap;
    }

    & .MuiSpeedDial-actions {
      align-items: flex-end;

      & .MuiSpeedDialAction-staticTooltipLabel {
        display: none;
      }

      & .SubActionButton-root {
        margin-right: 0;
      }
    }

    & .MuiSpeedDial-fab {
      border-radius: 28px;
      height: 56px;
    }
  `}
`;
