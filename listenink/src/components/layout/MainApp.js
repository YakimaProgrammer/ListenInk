
import React from 'react';
import styles from './MainApp.css';
import './MainApp.css';
import Sidebar from './Sidebar';

function MainApp() {
    return (

        <div className="app-container">
            {/* Sidebar */}



            <aside className="sidebar">
                <Sidebar></Sidebar>
            </aside>

            {/* Main Content Area */}
            <main className="main-content">
                <div className="top-view"> top view</div>
                <h1>Main Area</h1>
                <p>Welcome to the main area. Add your content here!</p>
                <div className="bottom-view">bottom view</div>
            </main>


        </div>
    );
}

export default MainApp;
