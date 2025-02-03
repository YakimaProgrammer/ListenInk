import { connect, ConnectedProps } from "react-redux";
import Box from '@mui/material/Box';
import { AppDispatch, RootState, setSidebar } from "../../store";

import styles from './index.module.scss';

import { MenuBar } from "./MenuBar";
import { Sidebar } from "./Sidebar";
import { Content } from "./Content";

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

function RootComponent({ sidebarOpen, setOpen, setClosed }: PropsFromRedux) {  
  return (
    <Box className={styles.root}>
      <MenuBar sidebarOpen={sidebarOpen} setOpen={setOpen} />
      <Sidebar sidebarOpen={sidebarOpen} setClosed={setClosed} />
      <Content sidebarOpen={sidebarOpen} />
    </Box>
  );
}

export const Root = connector(RootComponent);
