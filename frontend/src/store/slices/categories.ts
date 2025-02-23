import { z } from "zod";
import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { Bookmark, BookmarkSchema, Category, CategorySchema, Document, DocumentSchema, ErrSchema } from '@/types';
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

    builder
      .addCase(updateBookmark.fulfilled, (state, action: PayloadAction<Bookmark>) => {
	if (state.status === "success") {
	  const doc = state.documents[action.payload.documentId];
	  if (doc === undefined) {
	    console.error(`[ERROR] A document with id ${action.payload.documentId} was accepted by the server, but no matching document exists on the client!`);
	    return;
	  }
	  const index = doc.bookmarks.findIndex(bookmark => bookmark.id === action.payload.id);
	  if (index !== -1) {
	    // If found, replace the existing bookmark
	    doc.bookmarks[index] = action.payload;
	  } else {
	    // If not found, append the new bookmark
	    doc.bookmarks.push(action.payload);
	  }
	  
	} else {
	  // Either fetchDocuments() is still processing or an error occured while it was processing
	  console.error("[ERROR] Cannot reconcile client state with server state! Server accepted a bookmark modification, but the client does not have a valid document list!");
	}
      })
      .addCase(updateBookmark.rejected, (_, action: PayloadAction<string | undefined>) => {
	console.error(`[ERROR] An error occured when modifying a bookmark: ${action.payload}`);
      })
  }
});

const DocumentsOrErrSchema = z.union([z.array(DocumentSchema), ErrSchema]);
const CategoriesOrErrSchema = z.union([z.array(CategorySchema), ErrSchema]);

/** An async thunk that fetches all the documents and category data from the server.
 * Intended to run once on page load, but can be could again to resync with the server in an evil way
 */  
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
	console.error(docsResp.error.message);
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

interface UpdateBookmarkProps {
  docId: string;
  time?: number;
  page?: number;
  bookmarkId?: number | string;
}

const BookmarkOrErrSchema = z.union([BookmarkSchema, ErrSchema]);
/** An async thunk that handles a lot of work surrounding bookmarks and page-resumption.
 *
 * @param docId - required; which document to do bookmark things on. Returns an error if the document does not exist.
 * @param time - optional; the time to set/update the bookmark to in seconds. Defaults to zero.
 * @param page - optional; the zero-indexed page to set/update the bookmark to. Defaults to zero.
 * @param bookmarkId - optional; either a bookmarkId or the relative index of a bookmark. If omitted or if it points to a nonexistant bookmark, the field is ignored and a new bookmark is created.
 * @returns a new `Bookmark`
 */
export const updateBookmark = createAsyncThunk<
  Bookmark,
  UpdateBookmarkProps,
  { rejectValue: string, state: RootState }
>(
  'data/setPlaybackPosition',
  async ({ docId, time, page, bookmarkId }, { rejectWithValue, getState }) => {
    const state = getState();
    if (state.categories.status === "success") {
      const doc = state.categories.documents[docId];
      if (doc === undefined) {
	return rejectWithValue("No such document with that id exists!");
      } else {
	let bookmark: Bookmark | undefined = undefined;
	if (bookmarkId === undefined) {
	  bookmark = doc.bookmarks.at(0);
	} else if (typeof bookmarkId === "string") {
	  bookmark = doc.bookmarks.find(b => b.id === bookmarkId);
	} else if (typeof bookmarkId === "number") {
	  bookmark = doc.bookmarks.at(bookmarkId);
	}
	
	const slug = bookmark === undefined ? "" : `/${bookmark.id}`;
	const req = await fetch(`/api/v1/docs/${docId}/bookmarks${slug}`, {
	  method: bookmark === undefined ? "POST" : "PATCH",
	  headers: {
	    'Content-Type': 'application/json',
	  },
	  body: JSON.stringify({
	    // Pass the full infinite chaos of user input to the server...
	    page: page ?? bookmark?.page ?? 0,
	    audiotime: time ?? bookmark?.audiotime ?? 0
	  })
	});

	// ... and let the server decide if that change is a good idea or not
	const resp = BookmarkOrErrSchema.safeParse(await req.json());
	if (resp.success) {
	  if ("err" in resp.data) {
	    return rejectWithValue(resp.data.err);
	  } else {
	    return resp.data;
	  }
	} else {
	  return rejectWithValue(resp.error.message);
	}	
      }
    } else {
      return rejectWithValue("Can't set the playback position while categories are still pending!")
    }
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
