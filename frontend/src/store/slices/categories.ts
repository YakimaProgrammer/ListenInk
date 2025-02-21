import { z } from "zod";
import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { Category, CategorySchema, Document, DocumentSchema, ErrSchema } from '@/types';
import { PromiseState } from '../helper-types';
import { RootState } from "..";

export type PlaybackSpeed = "0.25" | "0.5" | "1" | "1.25" | "1.5" | "2";
export interface AudioPlayback {
  isPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
}

export type EnhancedDocument = Document & AudioPlayback;
interface CategoriesSuccessState {
  categories: Record<string, Category | undefined>,
  documents: Record<string, EnhancedDocument | undefined>
}

export type CategoriesState = PromiseState<CategoriesSuccessState>;

const initialState = { status: "pending" } as CategoriesState;

// TODO: setIsPlaying, setPlaybackPos, setPlaybackSpeed, setPlaybackEnd

// This is me being evil in TypeScript.
// This lets me dynamically create types like: {id: string, open: boolean}
// This is useful for writing single-purpose reducer actions without
// writing a massive amount of similar interfaces.
type StateChange<K extends string, T> = { id: string } & { [P in K]: T };

export const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    setIsPlaying: (state, action: PayloadAction<StateChange<"isPlaying", boolean>>) => {
      if (state.status === "success") {
	const doc = state.documents[action.payload.id];
	if (doc !== undefined) {
	  doc.isPlaying = action.payload.isPlaying;
	}
      }
    },
    setPlaybackSpeed: (state, action: PayloadAction<StateChange<"playbackSpeed", PlaybackSpeed>>) => {
      if (state.status === "success") {
	const doc = state.documents[action.payload.id];
	if (doc !== undefined) {
	  doc.playbackSpeed = action.payload.playbackSpeed;
	}
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (state: CategoriesState) => {
        state.status = 'pending';
      })
      .addCase(fetchDocuments.fulfilled, (_, action: PayloadAction<CategoriesSuccessState>) => {
	// Normally, I would use Immer to modify state, but the typechecker has trust issues 
        return {
	  status: "success",
	  ...action.payload
	}
      })
      .addCase(fetchDocuments.rejected, (_, action: PayloadAction<string | undefined>) => {
        return {
	  status: "failure",
	  message: action.payload ?? "An unknown error occured!"
	}
      });
  }
});

const DocumentsOrErrSchema = z.union([z.array(DocumentSchema), ErrSchema]);
const CategoriesOrErrSchema = z.union([z.array(CategorySchema), ErrSchema]);

export const fetchDocuments = createAsyncThunk<
  CategoriesSuccessState,
  void,
  { rejectValue: string }
>(
  'data/fetchDocuments',
  async (_, { rejectWithValue }) => {
    try {
      const docsReq = await fetch("/api/v1/docs");
      const docsResp = DocumentsOrErrSchema.safeParse(await docsReq.json());

      const catsReq = await fetch("/api/v1/categories");
      const catsResp = CategoriesOrErrSchema.safeParse(await catsReq.json());

      if (!docsResp.success) {
	return rejectWithValue("Could not parse document info!");
      }
      if ("err" in docsResp.data) {
	return rejectWithValue(docsResp.data.err);
      }

      if (!catsResp.success) {
	return rejectWithValue("Could not parse categories info!");
      }
      if ("err" in catsResp.data) {
	return rejectWithValue(catsResp.data.err);
      }

      return {
	documents: docsResp.data.reduce<Record<string, EnhancedDocument>>((acc, doc) => {
	  acc[doc.id] = { ...doc, isPlaying: false, playbackSpeed: "1" };
	  return acc;
	}, {}),
	categories: catsResp.data.reduce<Record<string, Category>>((acc, cat) => {
	  acc[cat.id] = cat;
	  return acc;
	}, {})
      };
    } catch (err) {
      return rejectWithValue("Error retrieving document info!");
    }
  }
);

export const setPlaybackPosition = createAsyncThunk<
  void,
  StateChange<"time", number>,
  { rejectValue: string }
>(
  'data/setPlaybackPosition',
  async ({ id, time }, { rejectWithValue }) => {
    
  }
);

export const selectCategories = createSelector(
  [(state: RootState) => state.categories],
  (categoriesState) => {
    if (categoriesState.status !== 'success') return {};

    const { categories, documents } = categoriesState;

    return Object.values(categories).reduce<Record<string, Category & { documents: Document[] }>>(
      (acc, category) => {
        if (category) {
          const relatedDocuments = Object.values(documents).filter(
            (doc) => doc && doc.categoryId === category.id
          ) as Document[];

          acc[category.id] = { ...category, documents: relatedDocuments };
        }
        return acc;
      },
      {}
    );
  }
);

export const { setPlaybackSpeed, setIsPlaying } = categoriesSlice.actions;

export default categoriesSlice.reducer;
