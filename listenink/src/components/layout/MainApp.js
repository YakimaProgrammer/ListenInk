
import React from 'react';
import styles from './MainApp.css';
import './MainApp.css';

function MainApp() {
  return (
    <div className = "container">
      
      {/* Left View (HStack side 1) */}
      <div className = "hstack">
        <p>Left View</p>
      </div>
      
      {/* Right View (HStack side 2) with three vertical sub-views */}
      <div className = "vstack">
        <div className = "subView">
          <p>Right Top</p>
        </div>
        <div className = "subView">
          <p>Right Middle</p>
        </div>
        <div className = "subView">
          <p>Right Bottom</p>
        </div>
      </div>

    </div>
  );
}

export default MainApp;
