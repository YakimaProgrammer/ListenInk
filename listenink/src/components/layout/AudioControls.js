
import React, { useState, useEffect } from "react";
import "./AudioControls.css";

function AudioControls() {
  const [isPlaying, setIsPlaying] = useState(false); // Play/Pause state
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0); // Playback speed
  const [currentPosition, setCurrentPosition] = useState(0); // the current time
  const [volume, setVolume] = useState(50); // Volume state (0-100)
  const totalLength = 300; // Example total length

  // Time formatting
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle Play/Pause
  const handlePlayPause = () => {
    setIsPlaying((prevState) => !prevState);
  };

  // Handle Rewind
  const handleRewind = () => {
    setCurrentPosition((prev) => Math.max(0, prev - 10));
  };

  // Handle Skip
  const handleSkip = () => {
    setCurrentPosition((prev) => Math.min(totalLength, prev + 10));
  };

  // Update the position while playing
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentPosition((prev) => Math.min(prev + 1, totalLength));
      }, 1000 / playbackSpeed);
    } else {
      clearInterval(interval);
    }

    return () => {
      clearInterval(interval);
    };
  }, [isPlaying, playbackSpeed]);

  // Handle Volume Change
  const handleVolumeChange = (e) => {
    setVolume(Number(e.target.value));
  };

  // Calculate time remaining
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
        {/* Volume Slider */}
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={handleVolumeChange}
          className="volume-slider"
        />
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
        <span className="time-remaining">{formatTime(timeRemaining)}</span>
      </div>
    </div>
  );
}

export default AudioControls;
