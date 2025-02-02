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


interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = ({ open, ...props }: AppBarProps) => (
  <MuiAppBar
    {...props}
    className={`${styles.appBar} ${open ? styles.appBarOpen : ''}`}
  />
);

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));


function RootComponent({ sidebarOpen, setOpen, setClosed }: PropsFromRedux) {
  const theme = useTheme();
  
  return (
    <Box className={styles.root}>
      <CssBaseline />
      <AppBar position="fixed" open={sidebarOpen}>
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
      </AppBar>
      <Drawer
        className={styles.drawer}
        variant="persistent"
        anchor="left"
        open={sidebarOpen}
        classes={{ paper: styles.drawerPaper }}
      >
        <DrawerHeader>
          <IconButton onClick={setClosed}>
            {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </DrawerHeader>
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
      <main className={`${styles.main} ${sidebarOpen ? styles.mainOpen : ''}`}>
        <DrawerHeader />
        <Typography>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit...
        </Typography>
      </main>
</Box>
  );
}

export const Root = connector(RootComponent);
