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
        <div className={`app-container`}>
            {/* Sidebar */}
            <aside className={`sidebar`}>
                <Sidebar />
            </aside>

            {/* Main Content Area */}
            <main className="main-content">
                <div className="top-view">
                    <div className="hstack">
                        <button className="toggle">
                            <i className="bi bi-layout-sidebar"></i>
                        </button>
                        <p className="left-align title-text">
                            {curDocument ? curDocument.name : "No Document Selected"}
                        </p>
                    </div>
                </div>
                <div style={{ whiteSpace: 'pre-line', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {curDocument ? (
                        <>
                            <div style={{ flex: 1, overflow: 'auto' }}>
                                <p>{curDocument.text}</p>
                            </div>
                            <div className="bottom-view" style={{ flexShrink: 0 }}>
                                <AudioControls />
                            </div>
                        </>
                    ) : (
                        <p style={{ margin: 'auto' }}>Please select a document to view its contents.</p>
                    )}
                </div>
            </main >
        </div >
    );
}

export default MainApp;
