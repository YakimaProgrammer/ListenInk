// i added it so that it can play right now, check out use effect

import React, { useState, useEffect } from "react";
import "./AudioControls.css";

function AudioControls() {
  const [isPlaying, setIsPlaying] = useState(false); // Play/Pause state
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0); // Playback speed
  const [currentPosition, setCurrentPosition] = useState(0); // the current time, will need to edit for fetching the time based on where it is
  const totalLength = 300; // random example i set just for rn to see

  //time formatting
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle Play/Pause
  const handlePlayPause = () => {
    setIsPlaying((prevState) => !prevState); //changes state
  };

  // Handle Rewind
  const handleRewind = () => {
    setCurrentPosition((prev) => Math.max(0, prev - 10)); //rewind
  };

  // Handle Skip
  const handleSkip = () => {
    setCurrentPosition((prev) => Math.min(totalLength, prev + 10)); //skip, like rewind would have to ensure gets the next chunk
  };

  // Update the position while playing
  // this is where the actual playing the bar happens, so it would have to sync up with the
  // thing (seconds)
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentPosition((prev) => Math.min(prev + 1, totalLength)); // Update the position every second
      }, 1000 / playbackSpeed); // Update every second based on playback speed
    } else {
      clearInterval(interval); // Clear interval when paused
    }

    return () => {
      clearInterval(interval);
    };
  }, [isPlaying, playbackSpeed]);

  //calculating time remaining
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
