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
  upsertBookmark,
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
      docId: doc?.id,
    };
  } else {
    throw new Error(
      "Impossible state reached - withDocuments() asserts that documents are loaded!"
    );
  }
}
function mapDispatchToProps(dispatch: AppDispatch, ownProps: InjectedProps) {
  return {
    setIsPlaying: (isPlaying: boolean) =>
      dispatch(setIsPlaying({ id: ownProps.docId, isPlaying })),
    setPlaybackSpeed: (playbackSpeed: PlaybackSpeed) =>
      dispatch(setPlaybackSpeed({ id: ownProps.docId, playbackSpeed })),
    setPlaybackPos: (pos: number) =>
      dispatch(upsertBookmark({ docId: ownProps.docId, time: pos })),
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
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  } else {
    return "--:--";
  }
}

class AudioControlsComponent extends Component<
  PropsFromRedux,
  AudioControlsState
> {
  audioRef: RefObject<HTMLAudioElement | null>;

  constructor(props: PropsFromRedux) {
    super(props);
    this.state = { duration: undefined, volume: 0.5 };
    this.audioRef = createRef();
  }

  componentDidMount() {
    const audio = this.audioRef.current;
    if (audio !== null) {
      audio.addEventListener("timeupdate", this.handleTimeUpdate);
      audio.addEventListener("ended", this.handleEnded);
      audio.addEventListener("loadedmetadata", this.handleLoadedMetadata);
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
      audio.removeEventListener("timeupdate", this.handleTimeUpdate);
      audio.removeEventListener("ended", this.handleEnded);
      audio.removeEventListener("loadedmetadata", this.handleLoadedMetadata);
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
    if (
      audio !== null &&
      isFinite(audio.duration) &&
      this.state.duration === undefined
    ) {
      this.setState({ duration: audio.duration });
    }
  };

  handleRewind = () => {
    this.props.setPlaybackPos(Math.max(0, this.props.playbackPos - 10));
  };

  handleSkip = () => {
    if (this.state.duration !== undefined) {
      this.props.setPlaybackPos(
        Math.min(this.state.duration, this.props.playbackPos + 10)
      );
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
      console.error(
        "Error! Received impossible input from select element: ",
        speed
      );
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
  };

  handleVolumeChange = (_: Event, newValue: number | number[]) => {
    // I'm not sure what a `number[]` means in terms of the slider, so I'm going to ignore it
    if (!Array.isArray(newValue)) {
      this.setState({ volume: newValue / 100 });
    }
  };

  render() {
    const { playbackPos, playbackSpeed, isPlaying, currentPage, docId } =
      this.props;
    const fractionComplete =
      this.state.duration === undefined ? 0 : playbackPos / this.state.duration;
    const timePlayed = Math.floor(playbackPos);
    const timeRemaining =
      this.state.duration === undefined ? 0 : this.state.duration - timePlayed;

    return (
      <Box className={styles.audioControls}>
        <div className={styles.progressContainer}>
          <Typography className={styles.timePlayed}>
            {formatTime(timePlayed)}
          </Typography>

          {/* Rewind button */}
          <Button onClick={this.handleRewind} className={styles.controlButton}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
              <text
                x="8"
                y="13"
                fontSize="6"
                fill="currentColor"
                textAnchor="middle"
              >
                10
              </text>
            </svg>
          </Button>

          {/* Play/Pause Button */}
          <Button
            variant="contained"
            onClick={this.handlePlayPause}
            className={styles.playPauseButton}
          >
            {isPlaying ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </Button>

          {/* Forward button */}
          <Button onClick={this.handleSkip} className={styles.controlButton}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
              <text
                x="16"
                y="13"
                fontSize="6"
                fill="currentColor"
                textAnchor="middle"
              >
                10
              </text>
            </svg>
          </Button>

          {/* Progress bar */}
          <Box className={styles.progressBar} onClick={this.handlePlaybarClick}>
            <Box
              className={styles.progress}
              style={{
                width: `${fractionComplete * 100}%`,
              }}
            />
          </Box>

          <Typography className={styles.timeRemaining}>
            -{formatTime(timeRemaining)}
          </Typography>

          {/* Speed control */}
          <FormControl size="small">
            <Select
              value={playbackSpeed}
              onChange={this.handlePlaybackSpeedChange}
              sx={{
                fontSize: "12px",
                height: "30px",
                minWidth: "60px",
                color: "#1d3557",
                ".MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(29, 53, 87, 0.3)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(29, 53, 87, 0.5)",
                },
              }}
            >
              <MenuItem value={"0.5"}>0.5x</MenuItem>
              <MenuItem value={"1"}>1x</MenuItem>
              <MenuItem value={"1.25"}>1.25x</MenuItem>
              <MenuItem value={"1.5"}>1.5x</MenuItem>
              <MenuItem value={"2"}>2x</MenuItem>
            </Select>
          </FormControl>
        </div>
      </Box>
    );
  }
}

export const AudioControls = withDocument(connector(AudioControlsComponent));
