import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  openCategories: Record<string, boolean | undefined>; // Sets would be fun, but aren't JSON serializable
  searchDialogOpen: boolean;
  searchQuery: string;
  audioPlaybacks: Record<string, AudioPlayback | undefined>
}

export type PlaybackSpeed = 0.25 | 0.5 | 1 | 1.25 | 1.5 | 2;

export interface AudioPlayback {
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  playbackPos: number;
  end: number;
}

// When this method is synced with the API, this function will be replaced by a thunk
export function newAudioPlayback({ isPlaying, playbackSpeed, playbackPos, end }: Partial<AudioPlayback>): AudioPlayback {
  console.warn("DEPRECATED + TODO: called `newAudioPlayback` instead of calling out to the API!");
  return {
    isPlaying: isPlaying ?? false,
    playbackSpeed: playbackSpeed ?? 1,
    playbackPos: playbackPos ?? 0,
    end: end ?? 300 // @TODO
  };
}
// For audio playback, there is a good chance we've never actually created the object
// we want to use yet. If so, we need to create it and tell Redux about it, otherwise
// we'll just update a property. Writing the same function over and over again with slight
// differences is annoying, so I wrote a higher-order-function that uses TypeScript wizardry
// to ensure that the resulting reducer functions are usefully typed based on AudioPlayback
// AND that only reducers for AudioPlayback props can be created.
function playbackActionCreator<K extends keyof AudioPlayback>(prop: K): (state: UIState, action: PayloadAction<StateChange<K, AudioPlayback[K]>>) => void {
  return (state, action) => {
    if (state.audioPlaybacks[action.payload.id] === undefined) {
	state.audioPlaybacks[action.payload.id] = newAudioPlayback({ [prop]: action.payload[prop] });
    } else {
      // I really, really don't like type assertions
      // Anyway, in this case, I know that our action is guaranteed to have a property
      // with the same type as the one that we are trying to set in the audio playback,
      // but since I'm doing such a complicated and dynamic type dance here, TypeScript
      // can't statically verify that.
      state.audioPlaybacks[action.payload.id]![prop] = action.payload[prop] as unknown as AudioPlayback[K];
      }
  };
}

// This is me being evil in TypeScript.
// This lets me dynamically create types like: {id: string, open: boolean}
// This is useful for writing single-purpose reducer actions without
// writing a massive amount of similar interfaces.
type StateChange<K extends string, T> = { id: string } & { [P in K]: T };

const initialState: UIState = {
  sidebarOpen: true,
  openCategories: {},
  searchDialogOpen: false,
  searchQuery: "",
  audioPlaybacks: {}
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSidebar: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },

    setCategory: (state, action: PayloadAction<StateChange<"open", boolean>>) => {
      state.openCategories[action.payload.id] = action.payload.open;
    },

    setQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    setSearchDialog: (state, action: PayloadAction<boolean>) => {
      state.searchDialogOpen = action.payload;
    },

    setIsPlaying: playbackActionCreator("isPlaying"),
    setPlaybackSpeed: playbackActionCreator("playbackSpeed"),
    setPlaybackPos: playbackActionCreator("playbackPos"),
    setPlaybackEnd: playbackActionCreator("end")
  },
})

export const {
  setSidebar,
  setCategory,
  setQuery,
  setSearchDialog,
  setIsPlaying,
  setPlaybackPos,
  setPlaybackSpeed,
  setPlaybackEnd
} = uiSlice.actions
export default uiSlice.reducer
