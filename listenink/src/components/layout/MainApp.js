
import React from 'react';
import styles from './MainApp.css';
import './MainApp.css';

function MainApp() {
  return (
    // <div className = "container">
      
    //   {/* Left View (HStack side 1) */}
    //   <div className = "hstack">
    //     <p>Left View</p>
    //   </div>
      
    //   {/* Right View (HStack side 2) with three vertical sub-views */}
    //   <div className = "vstack">
    //     <div className = "subView">
    //       <p>Right Top</p>
    //     </div>
    //     <div className = "subView">
    //       <p>Right Middle</p>
    //     </div>
    //     <div className = "subView">
    //       <p>Right Bottom</p>
    //     </div>
    //   </div>

    // </div>


    <div className="app-container">
      {/* Sidebar */}

      

      <aside className="sidebar">
        <h2>Sidebar</h2>
        <ul>
          <li>Menu Item 1</li>
          <li>Menu Item 2</li>
          <li>Menu Item 3</li>
        </ul>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <div className = "top-view"> top view</div>
        <h1>Main Area</h1>
        <p>Welcome to the main area. Add your content here!</p>
        <div className = "bottom-view">bottom view</div>
      </main>

      
    </div>
  );
}

export default MainApp;
