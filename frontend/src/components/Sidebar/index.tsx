import { connect } from "react-redux";
import { AppDispatch, RootState, setSidebar } from "../../store";
import style from "./index.module.scss";

interface SidebarProps {
  isOpen: boolean,
  dispatch: AppDispatch
}

function SidebarComponent({ isOpen, dispatch }: SidebarProps) {
  const sidebarStyle = `bi bi-layout-sidebar ${!isOpen ? style.show : ''}`;
  return (
    <div>
      <div className={style.menu}>
	<i className={sidebarStyle} onClick={() => dispatch(setSidebar(!isOpen))} />
	<span />
	<i className="bi bi-search"/>
	<i className="bi bi-pencil-square" />
      </div>
    </div>
  );
}

export const Sidebar = connect((state: RootState) => ({isOpen: state.ui.sidebarOpen}))(SidebarComponent);
