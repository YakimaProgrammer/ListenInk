
// UGLY AFFF
import React, { useState } from "react";
import "./AudioControls.css";

function AudioControls() {
  const [isPlaying, setIsPlaying] = useState(false); // Play/Pause state
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0); // Playback speed
  const [currentPosition, setCurrentPosition] = useState(0); // the current time, will need to edit for fetching the time based on where it is 
  const totalLength = 300; // random example i set just for rn to see

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    setIsPlaying((prevState) => !prevState); //changes state
  };

  const handleRewind = () => {
    setCurrentPosition((prev) => Math.max(0, prev - 10)); //rewind 
  };

  const handleSkip = () => {
    setCurrentPosition((prev) => Math.min(totalLength, prev + 10)); //skip, like rewind would have to ensure gets the next chunk
  };

  const timePlayed = currentPosition;
  const timeRemaining = totalLength - currentPosition;

  return (
    <div className="audio-controls">

      {/* Controls Section */}
      <div className="control-panel">
        <button onClick={handleRewind} className="control-button">
          ⏪ 10
        </button>
        <button onClick={handlePlayPause} className="play-pause-button">
          {isPlaying ? "⏸" : "▶️"}
        </button>
        <button onClick={handleSkip} className="control-button">
          10 ⏩
        </button>
        <select
          className="playback-speed"
          value={playbackSpeed}
          onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
        >
          <option value={0.5}>0.5x</option>
          <option value={1.0}>1x</option>
          <option value={1.25}>1.25x</option>
          <option value={1.5}>1.5x</option>
          <option value={2.0}>2x</option>
        </select>
      </div>

      {/* Progress Bar Section */}
      <div className="time-display">
        <span className="time-played">{formatTime(timePlayed)}</span>
        <div className="progress-bar">
          <div
            className="progress"
            style={{ width: `${(timePlayed / totalLength) * 100}%` }}
          ></div>
        </div>
        <span className="time-remaining">
          {formatTime(timeRemaining)}
        </span>
      </div>
    </div>
  );
}

export default AudioControls;
