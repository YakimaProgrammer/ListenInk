// --- frontend/src/components/AudioControls/index.tsx ---
import { useState, useEffect } from "react";
import styles from "./index.module.scss";
import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Select,
  Slider,
  Typography,
} from "@mui/material";
import { ArrowLeft, ArrowRight, Pause, PlayArrow } from "@mui/icons-material";

export function AudioControls() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [volume, setVolume] = useState(50);
  const totalLength = 300; // total in seconds

  // Format time as mm:ss
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  // handle play/pause
  const handlePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  // handle skip
  const handleRewind = () => {
    setCurrentPosition((prev) => Math.max(0, prev - 10));
  };
  const handleSkip = () => {
    setCurrentPosition((prev) => Math.min(totalLength, prev + 10));
  };

  // auto-increment position if playing
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentPosition((prev) => {
          const next = prev + 1 * playbackSpeed;
          if (next >= totalLength) {
            // stop at end
            clearInterval(timer);
            return totalLength;
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, playbackSpeed, totalLength]);

  // slider for volume (0-100)
  const handleVolumeChange = (_: any, newValue: number | number[]) => {
    if (typeof newValue === "number") setVolume(newValue);
  };

  const fractionComplete = currentPosition / totalLength;
  const timePlayed = Math.floor(currentPosition);
  const timeRemaining = totalLength - timePlayed;

  return (
    <Box className={styles.audioControls}>
      {/* Control Panel */}
      <Box className={styles.controlPanel}>
        <Button
          variant="outlined"
          onClick={handleRewind}
          className={styles.controlButton}
          startIcon={<ArrowLeft />}
        >
          10
        </Button>

        {/* <Button
          variant="contained"
          onClick={handlePlayPause}
          className={styles.playPauseButton}
          startIcon={isPlaying ? <Pause /> : <PlayArrow />}
        >
          {isPlaying ? "Pause" : "Play"}
        </Button> */}

        <div>
          <Button
            variant="contained"
            onClick={handlePlayPause}
            style={{
              backgroundColor: 'transparent',
              boxShadow: 'none',
              padding: 0,
              minWidth: 'auto',
              height: 'auto',
              
            }}
            startIcon={
              isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" 
                  width="51" 
                  height="50" 
                  fill="black" 
                  className="bi bi-pause-fill" 
                  viewBox="0 0 16 16">
                  <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5m5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5" />
                  
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="50"
                  height="50"
                  fill="black"
                  className="bi bi-play-fill"
                  viewBox="0 0 16 16"
                >
                  <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393" />
                </svg>
              )
            }
          />

        </div>
        <Button
          variant="outlined"
          onClick={handleSkip}
          className={styles.controlButton}
          endIcon={<ArrowRight />}
        >
          10
        </Button>

        {/* Playback Speed */}
        <FormControl size="small">
          <Select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
          >
            <MenuItem value={0.5}>0.5x</MenuItem>
            <MenuItem value={1}>1x</MenuItem>
            <MenuItem value={1.25}>1.25x</MenuItem>
            <MenuItem value={1.5}>1.5x</MenuItem>
            <MenuItem value={2}>2x</MenuItem>
          </Select>
        </FormControl>

        {/* Volume Slider */}
        {/* <Box display="flex" alignItems="center" ml={2}>
          <Typography variant="body2" mr={1}>
            Vol
          </Typography>
          <Slider
            value={volume}
            onChange={handleVolumeChange}
            aria-label="Volume"
            min={0}
            max={100}
            sx={{ width: 100 }}
          />
        </Box> */}
      </Box>

      {/* Progress bar */}
      <Box className={styles.timeDisplay}>
        <Typography variant="body2" className={styles.timePlayed}>
          {formatTime(timePlayed)}
        </Typography>
        <Box className={styles.progressBar}>
          <Box
            className={styles.progress}
            sx={{ width: `${fractionComplete * 100}%` }}
          />
        </Box>
        <Typography variant="body2" className={styles.timeRemaining}>
          -{formatTime(timeRemaining)}
        </Typography>
      </Box>
    </Box>
  );
}
