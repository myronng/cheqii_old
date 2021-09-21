import { Collapse, SpeedDial, SpeedDialAction, SpeedDialProps, Typography } from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { Add, SvgIconComponent } from "@mui/icons-material";
import { Check, BaseProps } from "declarations";
import { MouseEventHandler, useState } from "react";
import { useLoading } from "utilities/LoadingContextProvider";

export type ActionButtonProps = Pick<BaseProps, "className"> & {
  checkId: Check["id"];
  label: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  subActions: {
    Icon: SvgIconComponent;
    name: string;
    onClick: MouseEventHandler<HTMLButtonElement>;
  }[];
};
const FAB_ANIMATION_DELAY = 30;

export const ActionButton = styled((props: ActionButtonProps) => {
  const { loading } = useLoading();
  const [actionButtonOpen, setActionButtonOpen] = useState(false);
  const theme = useTheme();
  const subActionsLength = props.subActions.length;

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
      ariaLabel={props.label}
      className={`ActionButton-root ${props.className}`}
      FabProps={{
        color: "primary",
        disabled: loading.active,
        onClick: props.onClick,
        variant: "extended",
      }}
      icon={
        <>
          <Add className="ActionButton-icon" />
          <Collapse
            in={actionButtonOpen}
            orientation="horizontal"
            style={{
              transitionDelay: actionButtonOpen
                ? "0ms"
                : `${subActionsLength * FAB_ANIMATION_DELAY}ms`,
            }}
            timeout={theme.transitions.duration.shorter}
          >
            <Typography className="ActionButton-text" variant="body2">
              {props.label}
            </Typography>
          </Collapse>
        </>
      }
      onClose={handleActionButtonClose}
      onOpen={handleActionButtonOpen}
      open={actionButtonOpen}
    >
      {props.subActions.map(({ Icon, name, onClick }, index) => {
        return (
          <SpeedDialAction
            className="SubActionButton-root"
            FabProps={{
              onClick,
              size: "medium",
              variant: "extended",
            }}
            icon={
              <>
                <Icon className="ActionButton-icon" />
                <Collapse
                  in={actionButtonOpen}
                  orientation="horizontal"
                  style={{
                    transitionDelay: actionButtonOpen
                      ? `${index * FAB_ANIMATION_DELAY}ms`
                      : `${(subActionsLength - index) * FAB_ANIMATION_DELAY}ms`,
                  }}
                  timeout={
                    actionButtonOpen
                      ? theme.transitions.duration.shorter
                      : theme.transitions.duration.shortest
                  }
                >
                  <Typography className="ActionButton-text" variant="body2">
                    {name}
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
