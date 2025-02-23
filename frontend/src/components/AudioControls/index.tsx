import { ChangeEvent } from "react";
import { AppDispatch, RootState, setIsPlaying, setPlaybackSpeed, updateBookmark } from "@/store";
import { PlaybackSpeed } from "@/store/slices/categories";
import { connect, ConnectedProps } from "react-redux";
import { withDocument } from "../WithDocument";
import style from "./index.module.scss";

interface AudioControlsProps {
  docId: string
}

function mapStateToProps(state: RootState, ownProps: AudioControlsProps) {
  if (state.categories.status === "success") {
    return {
      isPlaying: state.categories.documents[ownProps.docId]?.isPlaying ?? false,
      end: 300, // Soon to be derived from the underlying audio element,
      playbackPos: state.categories.documents[ownProps.docId]?.bookmarks.at(0)?.audiotime ?? 0,
      playbackSpeed: state.categories.documents[ownProps.docId]?.playbackSpeed ?? "1"
    };
  } else {
    throw new Error("Attempted to render an AudioControls before documents were loaded!")
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

function AudioControlsComponent({ isPlaying, setIsPlaying, playbackSpeed, setPlaybackSpeed, playbackPos, setPlaybackPos, end }: PropsFromRedux) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleRewind = () => setPlaybackPos(Math.max(0, playbackPos - 10)); //rewind 
  const handleSkip = () => setPlaybackPos(Math.min(end, playbackPos + 10)); //skip, like rewind would have to ensure gets the next chunk
  const handlePlayPause = () => setIsPlaying(!isPlaying);

  const maybeSetPlaybackSpeed = (e: ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    if (isPlaybackSpeed(v)) {
      setPlaybackSpeed(v);
    } else {
      console.warn(`Received an impossible input from the select element! ${v} is not a PlaybackSpeed!`);
    }
  }
  
  const timeRemaining = end - playbackPos;

  return (
    <div className={style.audioControls}>

      {/* Controls Section */}
      <div className={style.controlPanel}>
        <button onClick={handleRewind} className={style.controlButton}>
          ⏪ 10
        </button>
        <button onClick={handlePlayPause} className={style.playPauseButton}>
          {isPlaying ? "⏸" : "▶️"}
        </button>
        <button onClick={handleSkip} className={style.controlButton}>
          10 ⏩
        </button>
        <select
          className={style.playbackSpeed}
          value={playbackSpeed}
          onChange={maybeSetPlaybackSpeed}
        >
	  <option value={0.25}>0.5x</option>
          <option value={0.5}>0.5x</option>
          <option value={1.0}>1x</option>
          <option value={1.25}>1.25x</option>
          <option value={1.5}>1.5x</option>
          <option value={2.0}>2x</option>
        </select>
      </div>

      {/* Progress Bar Section */}
      <div className={style.timeDisplay}>
        <span className={style.timePlayed}>{formatTime(playbackPos)}</span>
        <div className={style.progressBar}>
          <div
            className={style.progress}
            style={{ width: `${(playbackPos / end) * 100}%` }}
          ></div>
        </div>
        <span className={style.timeRemaining}>
          {formatTime(timeRemaining)}
        </span>
      </div>
    </div>
  );
}

export const AudioControls = withDocument(connector(AudioControlsComponent));
