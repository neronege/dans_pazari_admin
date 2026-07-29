// material-ui
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

// assets
import CommentOutlined from '@ant-design/icons/CommentOutlined';
import LockOutlined from '@ant-design/icons/LockOutlined';
import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';
import UnorderedListOutlined from '@ant-design/icons/UnorderedListOutlined';

// ==============================|| HEADER PROFILE - SETTING TAB ||============================== //

export default function SettingTab() {
  return (
    <List component="nav" sx={{ p: 0, '& .MuiListItemIcon-root': { minWidth: 32 } }}>
      <ListItemButton>
        <ListItemIcon>
          <QuestionCircleOutlined />
        </ListItemIcon>
        <ListItemText primary="Support" />
      </ListItemButton>
      <ListItemButton>
        <ListItemIcon>
          <UserOutlined />
        </ListItemIcon>
        <ListItemText primary="Account Settings" />
      </ListItemButton>
      <ListItemButton>
        <ListItemIcon>
          <LockOutlined />
        </ListItemIcon>
        <ListItemText primary="Privacy Center" />
      </ListItemButton>
      <ListItemButton>
        <ListItemIcon>
          <CommentOutlined />
        </ListItemIcon>
        <ListItemText primary="Feedback" />
      </ListItemButton>
      <ListItemButton>
        <ListItemIcon>
          <UnorderedListOutlined />
        </ListItemIcon>
        <ListItemText primary="History" />
      </ListItemButton>
    </List>
  );
}
