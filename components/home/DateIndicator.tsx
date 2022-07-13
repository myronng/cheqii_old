import { Update } from "@mui/icons-material";
import { Typography } from "@mui/material";
import { BaseProps } from "declarations";
import { useEffect, useState } from "react";

type DateIndicatorProps = Pick<BaseProps, "className"> & {
  dateTime: number;
  formatter: Intl.DateTimeFormat;
};

export const DateIndicator = ({ className, dateTime, formatter }: DateIndicatorProps) => {
  const [displayDate, setDisplayDate] = useState<number | string>(dateTime);

  useEffect(() => {
    if (typeof displayDate === "number") {
      setDisplayDate(formatter.format(new Date(displayDate)));
    }
  }, [displayDate, setDisplayDate]);

  return (
    <div className={`DateIndicator-root ${className}`}>
      <Update />
      <Typography
        component="time"
        dateTime={typeof displayDate === "string" ? displayDate : undefined}
        variant="subtitle1"
      >
        {displayDate}
      </Typography>
    </div>
  );
};

DateIndicator.displayName = "DateIndicator";
