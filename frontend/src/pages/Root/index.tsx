import { connect, ConnectedProps } from "react-redux";
import { AppDispatch, RootState, setSidebar } from "../../store";
import { Drawer, IconButton, Divider, List, ListItem, ListItemText, ListItemButton, ListItemIcon } from '@mui/material';
import { ChevronLeft, Inbox, Mail }  from '@mui/icons-material';
import { styled } from '@mui/material/styles';

import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';

import CssBaseline from '@mui/material/CssBaseline';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';

import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import InboxIcon from '@mui/icons-material/MoveToInbox';
import MailIcon from '@mui/icons-material/Mail';
import styles from './index.module.scss';

// Unfortunately, TypeScript kinda freaks out if you let in infer too much stuff at once
// By pulling these props out, we can handhold the typechecker so it doesn't think that
// these Redux-provided props are something other components need to worry about 
const mapStateToProps = (state: RootState) => ({
  sidebarOpen: state.ui.sidebarOpen,
});

const mapDispatchToProps = (dispatch: AppDispatch) => ({
  setOpen: () => dispatch(setSidebar(true)),
  setClosed: () => dispatch(setSidebar(false))
});

// Get inferred props from connect()
const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

interface MenuProps {
  sidebarOpen: boolean;
  setOpen: () => void;
}
function Menu({ sidebarOpen, setOpen }: MenuProps) {
  return (
    <MuiAppBar position="fixed" className={`${styles.appBar} ${sidebarOpen ? styles.appBarOpen : ''}`}>
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={setOpen}
          edge="start"
          className={`${styles.menuButton} ${sidebarOpen ? styles.hidden : ''}`}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap>
          Persistent drawer
        </Typography>
      </Toolbar>
    </MuiAppBar>
  );
}

interface SidebarProps {
  sidebarOpen: boolean;
  setClosed: () => void;
}
function Sidebar({ sidebarOpen, setClosed }: SidebarProps) {
  return (
    <Drawer
      className={styles.drawer}
      variant="persistent"
      anchor="left"
      open={sidebarOpen}
      classes={{ paper: styles.drawerPaper }}
    >
      <div className={styles.drawerHeader}>
        <IconButton onClick={setClosed}>
          <ChevronLeftIcon />
        </IconButton>
      </div>
      <Divider />
      <List>
        {['Inbox', 'Starred', 'Send email', 'Drafts'].map((text, index) => (
          <ListItem key={text} disablePadding>
            <ListItemButton>
              <ListItemIcon>
                {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
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
                {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

interface ContentProps {
  sidebarOpen: boolean;
}
function Content({ sidebarOpen }: ContentProps) {
  return (
    <main className={`${styles.main} ${sidebarOpen ? styles.mainOpen : ''}`}>
      <div className={styles.drawerHeader} />
      <Typography>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit...
      </Typography>
    </main>
  );
}

function RootComponent({ sidebarOpen, setOpen, setClosed }: PropsFromRedux) {  
  return (
    <Box className={styles.root}>
      <Menu sidebarOpen={sidebarOpen} setOpen={setOpen} />
      <Sidebar sidebarOpen={sidebarOpen} setClosed={setClosed} />
      <Content sidebarOpen={sidebarOpen} />
    </Box>
  );
}

export const Root = connector(RootComponent);
