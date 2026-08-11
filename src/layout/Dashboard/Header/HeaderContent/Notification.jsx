'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';

// material-ui
import Alert from '@mui/material/Alert';
import useMediaQuery from '@mui/material/useMediaQuery';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project imports
import MainCard from 'components/MainCard';
import IconButton from 'components/@extended/IconButton';
import Transitions from 'components/@extended/Transitions';
import useSupportInbox from 'modules/support/hooks/useSupportInbox';

// assets
import BellOutlined from '@ant-design/icons/BellOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import MessageOutlined from '@ant-design/icons/MessageOutlined';

// sx styles
const avatarSX = {
  width: 36,
  height: 36,
  fontSize: '1rem'
};

const actionSX = {
  mt: '6px',
  ml: 1,
  top: 'auto',
  right: 'auto',
  alignSelf: 'flex-start',

  transform: 'none'
};

// ==============================|| HEADER CONTENT - NOTIFICATION ||============================== //

export default function Notification() {
  const downMD = useMediaQuery((theme) => theme.breakpoints.down('md'));

  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const { emails, totalCount, error } = useSupportInbox({ unreadOnly: true, take: 5 });

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 0.75 }}>
      <IconButton
        color="secondary"
        variant="light"
        sx={(theme) => ({
          color: 'text.primary',
          bgcolor: open ? 'grey.100' : 'transparent'
        })}
        aria-label="open profile"
        ref={anchorRef}
        aria-controls={open ? 'profile-grow' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
      >
        <Badge badgeContent={totalCount} color="primary">
          <BellOutlined />
        </Badge>
      </IconButton>
      <Popper
        placement={downMD ? 'bottom' : 'bottom-end'}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        popperOptions={{ modifiers: [{ name: 'offset', options: { offset: [downMD ? -5 : 0, 9] } }] }}
      >
        {({ TransitionProps }) => (
          <Transitions type="grow" position={downMD ? 'top' : 'top-right'} in={open} {...TransitionProps}>
            <Paper sx={(theme) => ({ boxShadow: theme.customShadows.z1, width: '100%', minWidth: 285, maxWidth: { xs: 285, md: 420 } })}>
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard
                  title="Bildirimler"
                  elevation={0}
                  border={false}
                  content={false}
                  secondary={
                    <>
                      {totalCount > 0 && (
                        <Tooltip title="Destek kutusunu aç">
                          <IconButton color="success" size="small" component={Link} href="/support" onClick={() => setOpen(false)}>
                            <CheckCircleOutlined style={{ fontSize: '1.15rem' }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </>
                  }
                >
                  <List
                    component="nav"
                    sx={{
                      p: 0,
                      '& .MuiListItemButton-root': {
                        py: 0.5,
                        px: 2,
                        '& .MuiAvatar-root': avatarSX,
                        '& .MuiListItemSecondaryAction-root': { ...actionSX, position: 'relative' }
                      }
                    }}
                  >
                    {error ? (
                      <Alert severity="error" sx={{ m: 2 }}>
                        Bildirimler alınamadı.
                      </Alert>
                    ) : null}
                    {!error && emails.length === 0 ? (
                      <ListItem divider>
                        <ListItemText
                          primary={<Typography variant="subtitle1">Yeni bildirim yok</Typography>}
                          secondary="Okunmamış destek maili bulunmuyor."
                        />
                      </ListItem>
                    ) : null}
                    {!error &&
                      emails.map((email) => (
                        <ListItem
                          key={email.id}
                          divider
                          disablePadding
                          secondaryAction={
                            <Typography variant="caption" noWrap>
                              {email.receivedAtUtc
                                ? new Date(email.receivedAtUtc).toLocaleTimeString('tr-TR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : '-'}
                            </Typography>
                          }
                        >
                          <ListItemButton component={Link} href="/support" selected={!email.isRead} onClick={() => setOpen(false)}>
                            <ListItemAvatar>
                              <Avatar sx={{ color: 'primary.main', bgcolor: 'primary.lighter' }}>
                                <MessageOutlined />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle1" noWrap>
                                  {email.subject || email.fromEmail || 'Destek bildirimi'}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="body2" color="text.secondary" noWrap>
                                  {email.fromEmail || email.preview || '-'}
                                </Typography>
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    <ListItemButton component={Link} href="/support" onClick={() => setOpen(false)} sx={{ textAlign: 'center', py: `${12}px !important` }}>
                      <ListItemText
                        primary={
                          <Typography variant="h6" color="primary">
                            Tümünü Gör
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  </List>
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>
    </Box>
  );
}
