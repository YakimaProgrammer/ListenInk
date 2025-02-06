import { ChangeEvent } from "react";
import { AppDispatch, RootState } from "@/store";
import { newAudioPlayback, PlaybackSpeed, setIsPlaying, setPlaybackPos, setPlaybackSpeed } from "@/store/slices/ui";
import { connect, ConnectedProps } from "react-redux";
import { useDocument } from "../WithDocument";
import style from "./index.module.scss";


interface AudioControlsProps {
  docId: string
}

function mapStateToProps(state: RootState, ownProps: AudioControlsProps) {
  // The audio playback might not exist in the state. If it doesn't, we'll pretend it has the default values
  return state.ui.audioPlaybacks[ownProps.docId] ?? newAudioPlayback({});
}
function mapDispatchToProps(dispatch: AppDispatch, ownProps: AudioControlsProps) {
  return {
    setIsPlaying: (isPlaying: boolean) => dispatch(setIsPlaying({id: ownProps.docId, isPlaying })),
    setPlaybackSpeed: (playbackSpeed: PlaybackSpeed) => dispatch(setPlaybackSpeed({id: ownProps.docId, playbackSpeed })),
    setPlaybackPos: (pos: number) => dispatch(setPlaybackPos({ id: ownProps.docId, playbackPos: pos }))
  };
}
const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

function isPlaybackSpeed(speed: number): speed is PlaybackSpeed {
  switch (speed) {
    case 0.25:
    case 0.5:
    case 1:
    case 1.25:
    case 1.5:
    case 2:
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
    const v = parseFloat(e.target.value);
    if (isPlaybackSpeed(v)) {
      setPlaybackSpeed(v)
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

const ConnectedAudioControls = connector(AudioControlsComponent);
export function AudioControls() {
  const doc = useDocument();
  if (doc?.id !== undefined) {
    return <ConnectedAudioControls docId={doc?.id} />
  } else {
    return null;
  }
}
