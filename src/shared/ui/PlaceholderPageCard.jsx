import PropTypes from 'prop-types';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MainCard from 'components/MainCard';

export default function PlaceholderPageCard({ title, description }) {
  return (
    <MainCard>
      <Stack sx={{ gap: 1 }}>
        <Typography variant="h4">{title}</Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          {description}
        </Typography>
      </Stack>
    </MainCard>
  );
}

PlaceholderPageCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired
};
