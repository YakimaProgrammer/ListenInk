import { Drawer, IconButton, Divider, List, ListItem, ListItemText, ListItemButton, ListItemIcon } from '@mui/material';
import { Inbox, Mail, ChevronLeft } from "@mui/icons-material";
import styles from "./index.module.scss";
import shared from "../shared.module.scss";

interface SidebarProps {
  sidebarOpen: boolean;
  setClosed: () => void;
}
export function Sidebar({ sidebarOpen, setClosed }: SidebarProps) {
  return (
    <Drawer
      className={styles.drawer}
      variant="persistent"
      anchor="left"
      open={sidebarOpen}
      classes={{ paper: styles.drawerPaper }}
    >
      <div className={shared.drawerHeader}>
        <IconButton onClick={setClosed}>
          <ChevronLeft />
        </IconButton>
      </div>
      <Divider />
      <List>
        {['Inbox', 'Starred', 'Send email', 'Drafts'].map((text, index) => (
          <ListItem key={text} disablePadding>
            <ListItemButton>
              <ListItemIcon>
                {index % 2 === 0 ? <Inbox /> : <Mail />}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        {['All mail', 'Trash', 'Spam'].map((text, index) => (
          <ListItem key={text} disablePadding>
            <ListItemButton>
              <ListItemIcon>
                {index % 2 === 0 ? <Inbox /> : <Mail />}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}
