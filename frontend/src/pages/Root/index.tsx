import { connect, ConnectedProps } from "react-redux";
import Box from "@mui/material/Box";
import { AppDispatch, RootState, setSidebar } from "@/store";

import styles from "./index.module.scss";

// I made a very arbitrary choice here that I don't love
// All these components really only make sense in the context of the <Root /> page
// This component kind of does its own thing (but is still very context dependent on <Root />
import { SearchDialog } from "@/components/SearchDialog";
// ... but these components are just layout abstractions for how stuff is laid out
import { MenuBar } from "./MenuBar";
import { Sidebar } from "./Sidebar";
import { Content } from "./Content";
// Should these all be grouped together? Probably!

// Unfortunately, TypeScript kinda freaks out if you let infer too much stuff at once
// By pulling these props out, we can handhold the typechecker so it doesn't think that
// these Redux-provided props are something other components need to worry about
const mapStateToProps = (state: RootState) => ({
  sidebarOpen: state.ui.sidebarOpen,
});

const mapDispatchToProps = (dispatch: AppDispatch) => ({
  openSidebar: () => dispatch(setSidebar(true)),
});

// Get inferred props from connect()
const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

function RootComponent({
  sidebarOpen,
  openSidebar,
}: PropsFromRedux) {
  return (
    <Box className={styles.root}>
      <MenuBar sidebarOpen={sidebarOpen} setOpen={openSidebar} />
      <Sidebar />
      <Content />
      <SearchDialog />
    </Box>
  );
}

export const Root = connector(RootComponent);
