import { Add, SvgIconComponent } from "@mui/icons-material";
import { Collapse, SpeedDial, SpeedDialAction, SpeedDialProps } from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { BaseProps } from "declarations";
import { MouseEventHandler, useState } from "react";
import { useLoading } from "utilities/LoadingContextProvider";

type ActionButtonProps = Pick<BaseProps, "className"> & {
  Icon?: SvgIconComponent;
  label: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  subActions?: {
    Icon: SvgIconComponent;
    label: string;
    onClick: MouseEventHandler<HTMLButtonElement>;
  }[];
};
const FAB_ANIMATION_DELAY = 30;

export const ActionButton = styled((props: ActionButtonProps) => {
  const { loading } = useLoading();
  const [actionButtonOpen, setActionButtonOpen] = useState(false);
  const theme = useTheme();
  const subActionsLength = props.subActions?.length ?? 0;
  const Icon = props.Icon || Add;

  const handleActionButtonClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    if (props.subActions) {
      if (actionButtonOpen) {
        props.onClick(e);
      }
    } else {
      props.onClick(e);
    }
  };

  const handleActionButtonClose: SpeedDialProps["onClose"] = (_e, reason) => {
    // Don't close on primary FAB click
    if (reason !== "toggle") {
      setActionButtonOpen(false);
    }
  };

  const handleActionButtonOpen: SpeedDialProps["onOpen"] = (_e, reason) => {
    // Don't open on primary FAB click if no sub-actions
    if (props.subActions || reason !== "toggle") {
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
        onClick: handleActionButtonClick,
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
                ? "0ms"
                : `${subActionsLength * FAB_ANIMATION_DELAY}ms`,
            }}
            timeout={theme.transitions.duration.shorter}
          >
            <span className="ActionButton-label">{props.label}</span>
          </Collapse>
        </>
      }
      onClose={handleActionButtonClose}
      onOpen={handleActionButtonOpen}
      open={actionButtonOpen}
    >
      {props.subActions?.map(({ Icon, label, onClick }, index) => (
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
                <span className="ActionButton-label">{label}</span>
              </Collapse>
            </>
          }
          key={index}
          tooltipOpen // Used for MuiSpeedDialAction-staticTooltipLabel class
        />
      ))}
    </SpeedDial>
  );
})`
  ${({ theme }) => `
    align-items: flex-end;
    bottom: ${theme.spacing(2)};
    position: fixed;
    right: ${theme.spacing(2)};

    & .ActionButton-label {
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

ActionButton.displayName = "ActionButton";
