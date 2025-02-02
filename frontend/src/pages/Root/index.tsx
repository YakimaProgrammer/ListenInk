import { connect } from "react-redux";
import { Sidebar } from "../../components/Sidebar";
import { RootState } from "../../store";
import style from "./index.module.scss";

interface RootProps {
  sidebarOpen: boolean
}

function RootComponent({ sidebarOpen }: RootProps) {
  const pageStyle = sidebarOpen ? style.page : `${style.page} ${style.sidebarHidden}`;
  
  return (
    <div className={pageStyle}>
      {/* Sidebar */}
      <div className={style.sidebar}>
	<Sidebar />
      </div>

      {/* Main panel */}
      <div className={style.main}>

      </div>
    </div>
  );
}

export const Root = connect((state: RootState) => ({ sidebarOpen: state.ui.sidebarOpen }))(RootComponent);
