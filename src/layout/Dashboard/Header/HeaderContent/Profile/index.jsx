'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

// material-ui
import ButtonBase from '@mui/material/ButtonBase';
import CardContent from '@mui/material/CardContent';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project imports
import ProfileTab from './ProfileTab';
import Avatar from 'components/@extended/Avatar';
import MainCard from 'components/MainCard';
import Transitions from 'components/@extended/Transitions';
import IconButton from 'components/@extended/IconButton';
import { getAccessToken, getCurrentUser } from 'shared/api';
import { logout } from 'modules/auth/api';
import { decodeJwtPayload } from 'modules/auth/model/jwt';

// assets
import LogoutOutlined from '@ant-design/icons/LogoutOutlined';
const avatar1 = '/assets/images/users/avatar-1.png';

function toDisplayName(user, payload) {
  const fromUser =
    user?.fullName ||
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.email;

  const fromPayload =
    payload?.name ||
    payload?.unique_name ||
    payload?.preferred_username ||
    payload?.email ||
    payload?.sub;

  return fromUser || fromPayload || 'Admin Kullanici';
}

function toDisplayRole(user, payload) {
  const schemaRole = payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
  const role = user?.role || payload?.role || schemaRole;
  if (Array.isArray(role)) {
    return role[0] || 'Admin';
  }

  return role || 'Admin';
}

// ==============================|| HEADER CONTENT - PROFILE ||============================== //

export default function Profile() {
  const router = useRouter();

  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);

  const profileInfo = useMemo(() => {
    const user = getCurrentUser();
    const payload = decodeJwtPayload(getAccessToken());

    return {
      name: toDisplayName(user, payload),
      role: toDisplayRole(user, payload)
    };
  }, [open]);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setOpen(false);
      router.replace('/login');
    }
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 'auto' }}>
      <Tooltip title="Profile" disableInteractive>
        <ButtonBase
          sx={(theme) => ({
            p: 0.25,
            borderRadius: 1,
            '&:focus-visible': { outline: `2px solid ${theme.vars.palette.secondary.dark}`, outlineOffset: 2 }
          })}
          aria-label="open profile"
          ref={anchorRef}
          aria-controls={open ? 'profile-grow' : undefined}
          aria-haspopup="true"
          onClick={handleToggle}
        >
          <Avatar alt="profile user" src={avatar1} size="sm" sx={{ '&:hover': { outline: '1px solid', outlineColor: 'primary.main' } }} />
        </ButtonBase>
      </Tooltip>
      <Popper
        placement="bottom-end"
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        popperOptions={{
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, 9]
              }
            }
          ]
        }}
      >
        {({ TransitionProps }) => (
          <Transitions type="grow" position="top-right" in={open} {...TransitionProps}>
            <Paper sx={(theme) => ({ boxShadow: theme.vars.customShadows.z1, width: 290, minWidth: 240, maxWidth: { xs: 250, md: 290 } })}>
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard elevation={0} border={false} content={false}>
                  <CardContent sx={{ px: 2.5, pt: 3 }}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <Stack direction="row" sx={{ gap: 1.25, alignItems: 'center' }}>
                        <Avatar alt="profile user" src={avatar1} sx={{ width: 32, height: 32 }} />
                        <Stack>
                          <Typography variant="h6">{profileInfo.name}</Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {profileInfo.role}
                          </Typography>
                        </Stack>
                      </Stack>
                      <Tooltip title="Logout">
                        <IconButton size="large" sx={{ color: 'text.primary' }} onClick={handleLogout}>
                          <LogoutOutlined />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </CardContent>
                  <Box>
                    <ProfileTab onLogout={handleLogout} />
                  </Box>
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>
    </Box>
  );
}
