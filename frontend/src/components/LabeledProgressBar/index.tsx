import LinearProgress, { LinearProgressProps } from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

interface LinearProgressWithLabelProps extends Omit<LinearProgressProps, "value"> {
  /** The total number of pages in the document, or null if unknown */
  maxPages: number | null,
  /** The zero-indexed page that is being processed */
  page: number
}

export function LinearProgressWithLabel(props: LinearProgressWithLabelProps) {
  const { maxPages, page, ...progressProps } = props;
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" {...progressProps} value={maxPages === null ? 0 : ((page + 1) / maxPages) * 100} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography
          variant="body2"
          sx={{ color: 'white' }}
        >{maxPages === null ? '---' : `${page + 1}/${maxPages}`}</Typography>
      </Box>
    </Box>
  );
}
