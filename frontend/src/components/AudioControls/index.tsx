import { Component, createRef, RefObject, MouseEvent } from "react";
import { connect, ConnectedProps } from "react-redux";
import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import { InjectedProps, withDocument } from "@/components/WithDocument";
import {
  AppDispatch,
  RootState,
  setIsPlaying,
  setPlaybackSpeed,
  upsertBookmark
} from "@/store";
import { PlaybackSpeed } from "@/store/slices/categories";
import styles from "./index.module.scss";

interface AudioControlsState {
  duration?: number;
  volume: number;
}

function mapStateToProps(state: RootState, ownProps: InjectedProps) {
  if (state.categories.status === "success") {
    const doc = state.categories.documents[ownProps.docId];
    return {
      isPlaying: doc?.isPlaying ?? false,
      playbackPos: doc?.bookmarks.at(0)?.audiotime ?? 0,
      playbackSpeed: doc?.playbackSpeed ?? "1",
      currentPage: doc?.bookmarks.at(0)?.page ?? 0,
      docId: doc?.id
    };
  } else {
    throw new Error("Impossible state reached - withDocuments() asserts that documents are loaded!")
  }
}
function mapDispatchToProps(dispatch: AppDispatch, ownProps: InjectedProps) {
  return {
    setIsPlaying: (isPlaying: boolean) => dispatch(setIsPlaying({id: ownProps.docId, isPlaying })),
    setPlaybackSpeed: (playbackSpeed: PlaybackSpeed) => dispatch(setPlaybackSpeed({id: ownProps.docId, playbackSpeed })),
    setPlaybackPos: (pos: number) => dispatch(upsertBookmark({ docId: ownProps.docId, time: pos }))
  };
}
const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

function isPlaybackSpeed(speed: string): speed is PlaybackSpeed {
  switch (speed) {
    case "0.25":
    case "0.5":
    case "1":
    case "1.25":
    case "1.5":
    case "2":
      return true;
    default:
      return false;
  }
}

function formatTime(seconds?: number) {
  if (seconds !== undefined) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  } else {
    return "--:--";
  }
}

class AudioControlsComponent extends Component<PropsFromRedux, AudioControlsState> {
  audioRef: RefObject<HTMLAudioElement | null>;
  
  constructor(props: PropsFromRedux) {
    super(props);
    this.state = { duration: undefined, volume: 0.5 };
    this.audioRef = createRef();
  }

  componentDidMount() {
    const audio = this.audioRef.current;
    if (audio !== null) {
      audio.addEventListener('timeupdate', this.handleTimeUpdate);
      audio.addEventListener('ended', this.handleEnded);
      audio.addEventListener('loadedmetadata', this.handleLoadedMetadata);
      audio.currentTime = this.props.playbackPos;
      audio.volume = this.state.volume;
    }
  }

  componentDidUpdate(prevProps: PropsFromRedux) {
    const audio = this.audioRef.current;
    if (audio !== null) {
      if (prevProps.isPlaying !== this.props.isPlaying) {
        this.props.isPlaying ? audio.play() : audio.pause();
      }
      if (prevProps.playbackSpeed !== this.props.playbackSpeed) {
        audio.playbackRate = parseFloat(this.props.playbackSpeed);
      }
      if (Math.abs(audio.currentTime - this.props.playbackPos) > 1) {
        audio.currentTime = this.props.playbackPos;
      }
      audio.volume = this.state.volume;
    }
  }

  componentWillUnmount() {
    const audio = this.audioRef.current;
    if (audio !== null) {
      audio.removeEventListener('timeupdate', this.handleTimeUpdate);
      audio.removeEventListener('ended', this.handleEnded);
      audio.removeEventListener('loadedmetadata', this.handleLoadedMetadata);
    }
  }

  handleTimeUpdate = () => {
    const audio = this.audioRef.current;
    if (audio !== null) {
      // Debounce a little bit so we don't spam the server
      if (Math.abs(audio.currentTime - this.props.playbackPos) > 1) {
	// audio.currentTime is in seconds
	this.props.setPlaybackPos(audio.currentTime);
      }

      // Sometimes we can get the audio position right out of the gate, but other times we have to wait until we start playing for that data to be available
      this.handleLoadedMetadata();
    }
  };

  handleEnded = () => {
    this.props.setIsPlaying(false);
  };

  handleLoadedMetadata = () => {
    const audio = this.audioRef.current;
    if (audio !== null && isFinite(audio.duration) && this.state.duration === undefined) {
      this.setState({ duration: audio.duration });
    }
  };

  handleRewind = () => {
    this.props.setPlaybackPos(Math.max(0, this.props.playbackPos - 10));
  };

  handleSkip = () => {
    if (this.state.duration !== undefined) {
      this.props.setPlaybackPos(Math.min(this.state.duration, this.props.playbackPos + 10));
    }
  };

  handlePlayPause = () => {
    this.props.setIsPlaying(!this.props.isPlaying);
  };

  handlePlaybackSpeedChange = (e: SelectChangeEvent) => {
    const speed = e.target.value;
    if (isPlaybackSpeed(speed)) {
      this.props.setPlaybackSpeed(speed);
    } else {
      console.error("Error! Received impossible input from select element: ", speed);
    }
  };

  handlePlaybarClick = (e: MouseEvent<HTMLSpanElement>) => {
    if (this.state.duration !== undefined) {
      // Get the bounding box of the span
      const rect = e.currentTarget.getBoundingClientRect();
      // Calculate the x-coordinate of the click relative to the span
      const clickX = e.clientX - rect.left;
      // Calculate the width of the span
      const spanWidth = rect.width;

      // Use that to calculate the new time to jump to
      this.props.setPlaybackPos(this.state.duration * (clickX / spanWidth));
    }
  }

  handleVolumeChange = (_: Event, newValue: number | number[]) => {
    // I'm not sure what a `number[]` means in terms of the slider, so I'm going to ignore it
    if (!Array.isArray(newValue)) {
      this.setState({ volume: newValue / 100 });
    }
  }

  render() {
    const { playbackPos, playbackSpeed, isPlaying, currentPage, docId } = this.props;
    const fractionComplete = this.state.duration === undefined ? 0 : playbackPos / this.state.duration;
    const timePlayed = Math.floor(playbackPos);
    const timeRemaining = this.state.duration === undefined ? 0 : this.state.duration - timePlayed;
    
  return (
    <Box className={styles.audioControls}>
      {/* Control Panel */}
      <Box className={styles.controlPanel}>
	<audio
          ref={this.audioRef}
          src={`/api/v1/docs/${docId}/pages/${currentPage}/audio`}
        />
        <Button
          onClick={this.handleRewind}
          className={styles.controlButton}
          style={{ padding: 0, width: '50px', height: '50px' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24">
            <path d="M11.99,5V1l-5,5l5,5V7c3.31,0,6,2.69,6,6s-2.69,6-6,6s-6-2.69-6-6h-2c0,4.42,3.58,8,8,8s8-3.58,8-8S16.41,5,11.99,5z" />
            <text x="12" y="16" fontSize="6" textAnchor="middle" fill="black">10</text> {/* The text */}
          </svg>
        </Button>


        {/* Play/Pause Button */}
        <div>
          <Button
            variant="contained"
            onClick={this.handlePlayPause}
            style={{
              backgroundColor: 'transparent',
              boxShadow: 'none',
              padding: 0,
              minWidth: 'auto',
              height: 'auto',
            }}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="black" viewBox="0 0 16 16">
                <path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5m5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="black" viewBox="0 0 16 16">
                <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393" />
              </svg>
            )}
          </Button>
        </div>


        <Button
          onClick={this.handleSkip}
          className={styles.controlButton}
          style={{ padding: 0, width: '50px', height: '50px' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24">
            <path fill="none" d="M0 0h24v24H0z" />
            <path d="M11.99 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8" />
            <text x="12" y="16" fontSize="6" textAnchor="middle" fill="black">10</text>
          </svg>
        </Button>


        {/* Playback Speed */}
        <FormControl size="small">
          <Select
            value={playbackSpeed}
            onChange={this.handlePlaybackSpeedChange}
          >
            <MenuItem value={"0.5"}>0.5x</MenuItem>
            <MenuItem value={"1"}>1x</MenuItem>
            <MenuItem value={"1.25"}>1.25x</MenuItem>
            <MenuItem value={"1.5"}>1.5x</MenuItem>
            <MenuItem value={"2"}>2x</MenuItem>
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
        <Typography className={styles.timePlayed}>
          {formatTime(timePlayed)}
        </Typography>
        <Box className={styles.progressBar} style={{ width: '1000px' }}>
          <Box
            className={styles.progress}
            style={{
              width: `${fractionComplete * 100}%`,
              backgroundColor: 'black',
            }}
          />
        </Box>
        <Typography className={styles.timeRemaining}>
          -{formatTime(timeRemaining)}
        </Typography>
      </Box>
    </Box>
  );
  }
}

export const AudioControls = withDocument(connector(AudioControlsComponent));
