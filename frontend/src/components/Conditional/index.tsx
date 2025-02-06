import { ReactNode } from 'react';
import { Box, CircularProgress, Typography, Icon } from "@mui/material";
import { WarningAmber } from "@mui/icons-material";
import { LoadingState } from '@/store/helper-types';

import styles from "./index.module.scss";

interface ConditionalProps {
  status: LoadingState;
  reason?: string;
  children?: ReactNode;
}

export function Conditional({ status, reason, children }: ConditionalProps) {
  switch (status) {
    case "success":
      return <>{ children }</>;

    case "pending":
      return (
        <Box className={styles.box}>
          <CircularProgress />
	</Box>
      );

    case "failure":
      return (
        <Box className={styles.box}>
          <Icon color="error">
	    <WarningAmber />
	  </Icon>
	  <Typography>{reason}</Typography>
	</Box>
      );
  }
}
