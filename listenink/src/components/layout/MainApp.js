
import React from 'react';
import styles from './MainApp.css';

function MainApp() {
  return (
    <div style={styles.container}>
      
      {/* Left View (HStack side 1) */}
      <div style={styles.hstack}>
        <p>Left View</p>
      </div>
      
      {/* Right View (HStack side 2) with three vertical sub-views */}
      <div style={styles.vstack}>
        <div style={styles.subView}>
          <p>Right Top</p>
        </div>
        <div style={styles.subView}>
          <p>Right Middle</p>
        </div>
        <div style={styles.subView}>
          <p>Right Bottom</p>
        </div>
      </div>

    </div>
  );
}

export default MainApp;
