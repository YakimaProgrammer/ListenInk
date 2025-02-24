import { ChangeEvent, Component, createRef, RefObject, MouseEvent } from "react";
import { AppDispatch, RootState, setIsPlaying, setPlaybackSpeed, updateBookmark } from "@/store";
import { PlaybackSpeed } from "@/store/slices/categories";
import { connect, ConnectedProps } from "react-redux";
import { InjectedProps, withDocument } from "@/components/WithDocument";
import { Document } from "@/types";
import style from "./index.module.scss";

interface AudioControlsProps {
  docId: string
  doc: Document
}

interface AudioControlsState {
  duration?: number;
}

function mapStateToProps(state: RootState, ownProps: AudioControlsProps) {
  if (state.categories.status === "success") {
    const doc = state.categories.documents[ownProps.docId];
    return {
      isPlaying: doc?.isPlaying ?? false,
      playbackPos: doc?.bookmarks.at(0)?.audiotime ?? 0,
      playbackSpeed: doc?.playbackSpeed ?? "1",
      currentPage: doc?.bookmarks.at(0)?.page ?? 0
    };
  } else {
    throw new Error("Impossible state reached - withDocuments() asserts that documents are loaded!")
  }
}
function mapDispatchToProps(dispatch: AppDispatch, ownProps: AudioControlsProps) {
  return {
    setIsPlaying: (isPlaying: boolean) => dispatch(setIsPlaying({id: ownProps.docId, isPlaying })),
    setPlaybackSpeed: (playbackSpeed: PlaybackSpeed) => dispatch(setPlaybackSpeed({id: ownProps.docId, playbackSpeed })),
    setPlaybackPos: (pos: number) => dispatch(updateBookmark({ docId: ownProps.docId, time: pos }))
  };
}
const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector> & InjectedProps;

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

function clamp(num: number, min: number, max: number): number {
  return Math.min(Math.max(num, min), max);
}

class AudioControlsComponent extends Component<PropsFromRedux, AudioControlsState> {
  audioRef: RefObject<HTMLAudioElement | null>;
  
  constructor(props: PropsFromRedux) {
    super(props);
    this.state = { duration: undefined };
    this.audioRef = createRef();
  }

  componentDidMount() {
    const audio = this.audioRef.current;
    if (audio !== null) {
      audio.addEventListener('timeupdate', this.handleTimeUpdate);
      audio.addEventListener('ended', this.handleEnded);
      audio.addEventListener('loadedmetadata', this.handleLoadedMetadata);
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

  handlePlaybackSpeedChange = (e: ChangeEvent<HTMLSelectElement>) => {
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

  formatTime = (seconds?: number) => {
    if (seconds !== undefined) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    } else {
      return "--:--";
    }
  };

  render() {
    const { docId, currentPage, playbackPos, playbackSpeed, isPlaying } = this.props;
    const timeRemaining = this.state.duration === undefined ? undefined : clamp(this.state.duration - playbackPos, 0, this.state.duration);
    const width = this.state.duration === undefined ? 0 : clamp((playbackPos / this.state.duration) * 100, 0, 100);
    
    return (
      <div className={style.audioControls}>
        <audio
          ref={this.audioRef}
          src={`/api/v1/docs/${docId}/pages/${currentPage}/audio`}
        />
        <div className={style.controlPanel}>
          <button onClick={this.handleRewind} className={style.controlButton}>
            ⏪ 10
          </button>
          <button onClick={this.handlePlayPause} className={style.playPauseButton}>
            {isPlaying ? '⏸' : '▶️'}
          </button>
          <button onClick={this.handleSkip} className={style.controlButton}>
            10 ⏩
          </button>
          <select
            className={style.playbackSpeed}
            value={playbackSpeed}
            onChange={this.handlePlaybackSpeedChange}
          >
            <option value="0.25">0.25x</option>
            <option value="0.5">0.5x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
        </div>
        <div className={style.timeDisplay}>
          <span className={style.timePlayed}>{this.formatTime(playbackPos)}</span>
          <div className={style.progressBar} onClick={this.handlePlaybarClick}>
            <div
              className={style.progress}
              style={{ width: `${width}%` }}
            ></div>
          </div>
          <span className={style.timeRemaining}>
            {this.formatTime(timeRemaining)}
          </span>
        </div>
      </div>
    );
  }
}

export const AudioControls = withDocument(connector(AudioControlsComponent));
