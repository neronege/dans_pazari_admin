// material-ui
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function Footer() {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      sx={{ gap: 1.5, alignItems: 'center', justifyContent: 'space-between', p: '24px 16px 0px', mt: 'auto' }}
    >
      <Typography variant="caption">
        &copy; All rights reserved Mantis
      </Typography>
      <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ color: 'text.primary' }}>
          Local build
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.primary' }}>
          License included
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.primary' }}>
          Terms
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.primary' }}>
          Design system
        </Typography>
      </Stack>
    </Stack>
  );
}
