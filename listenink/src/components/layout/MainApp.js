import React, { useState } from "react";
import "./MainApp.css";
import Sidebar from "./Sidebar";
import AudioControls from "./AudioControls";
import 'bootstrap-icons/font/bootstrap-icons.css';


import { useCategories } from '../../contexts/CategoriesContext';

function MainApp() {
    const { categories, curDocument, setCurDocument } = useCategories();

    const [isSidebarVisible, setIsSidebarVisible] = useState(true);

    const toggleSidebar = () => {
        setIsSidebarVisible(!isSidebarVisible);
    };

    return (
        <div className={`app-container ${!isSidebarVisible ? "sidebar-hidden" : ""}`}>
            {/* Sidebar */}
            <aside className={`sidebar ${!isSidebarVisible ? "hidden" : ""}`}>
                <Sidebar onToggleSidebar={toggleSidebar} />
            </aside>

            {/* Main Content Area */}
            <main className="main-content">
                <div className="top-view">
                    <div className="hstack">
                        <button className={`toggle ${!isSidebarVisible ? "sidebar-hidden" : ""}`} onClick={toggleSidebar}>
                            <i className="bi bi-layout-sidebar"></i>
                        </button>
                        <p className="left-align title-text">
                            {curDocument.name}
                        </p>
                    </div>
                </div>
                <p style={{ whiteSpace: 'pre-line' }}>{curDocument.text}</p>
                <div className="bottom-view">
                    <AudioControls></AudioControls>
                </div>
            </main>
        </div>



    );
}

export default MainApp;
