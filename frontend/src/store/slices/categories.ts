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
      });

    builder
      .addCase(updateDocument.fulfilled, (state, action: PayloadAction<Document>) => {
	if (state.status === "success") {
	  const doc = state.documents[action.payload.id];
	  if (doc === undefined) {
	    console.error("[ERROR] The server accepted modifications to a Document that does not exist on the client!");
	  } else {
	    state.documents[action.payload.id] = {...doc, ...action.payload};
	  }
	} else {
	  // Either fetchDocuments() is still processing or an error occured while it was processing
	  console.error("[ERROR] Cannot reconcile client state with server state! Server accepted a Document modification, but the client does not have a valid document list!");
	}
      })
      .addCase(updateDocument.rejected, (_, action: PayloadAction<string | undefined>) => {
	console.error(`[ERROR] An error occured when modifying a Document: ${action.payload}`);
      });

    builder
      .addCase(upsertCategory.fulfilled, (state, action: PayloadAction<Category>) => {
	if (state.status === "success") {
	  const cat = state.categories[action.payload.id];
	  state.categories[action.payload.id] = {...cat, ...action.payload};
	} else {
	  // Either fetchDocuments() is still processing or an error occured while it was processing
	  console.error("[ERROR] Cannot reconcile client state with server state! Server accepted a Category modification, but the client does not have a valid document list!");
	}
      })
      .addCase(upsertCategory.rejected, (_, action: PayloadAction<string | undefined>) => {
	console.error(`[ERROR] An error occured when modifying a Category: ${action.payload}`);
      });

    builder
      .addCase(createDocument.fulfilled, (state, action: PayloadAction<EnhancedDocument>) => {
	if (state.status === "success") {
	  state.documents[action.payload.id] = action.payload;
	} else {
	  console.error("[ERROR] Cannot reconcile client state with server state! Server accepted a Document creation, but the client does not have a valid document list!")
	}
      })
      .addCase(createDocument.rejected, (_, action: PayloadAction<string | undefined>) => {
	console.error(`[ERROR] An error occured creating a new document: ${action.payload}`);
      });

    builder
      .addCase(deleteCategory.fulfilled, (state, action: PayloadAction<string>) => {
	if (state.status === "success") {
	  delete state.categories[action.payload];
	  for (const [key, doc] of Object.entries(state.documents)) {
	    if (doc?.categoryId === action.payload) {
	      delete state.documents[key];
	    }
	  }
	} else {
	  console.error("[ERROR] Cannot reconcile client state with server state! Server accepted a Category deletion, but the client does not have a valid document list!")
	}
      })
      .addCase(deleteCategory.rejected, (_, action: PayloadAction<string | undefined>) => {
	console.error(`[ERROR] Error when deleting a category: ${action.payload}`)
      });

    builder
      .addCase(deleteDocument.fulfilled, (state, action: PayloadAction<string>) => {
	if (state.status === "success") {
	  delete state.documents[action.payload];
	} else {
	  console.error("[ERROR] Cannot reconcile client state with server state! Server accepted a Document deletion, but the client does not have a valid document list!")
	}
      })
      .addCase(deleteDocument.rejected, (_, action: PayloadAction<string | undefined>) => {
	console.error(`[ERROR] Error when deleting a Document: ${action.payload}`)
      });
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
  'data/upsertBookmark',
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

interface UpdateDocumentProps {
  docId: string;
  name?: string;
  categoryId?: string;
  order?: number;
}
const DocumentOrErrSchema = z.union([DocumentSchema, ErrSchema]);

/** An async thunk for modifying document properties
 *
 * @param docId - required; which document to modify. Returns an error if the document does not exist.
 * @param name - optional; the new name for the document.
 * @param categoryId - optional; the new category for the document. Rejects if the category does not exist
 * @param order - optional; a new index for the document in its current, or new, category. Rejects if out of bounds.
 * @returns a new `Document`
 */
export const updateDocument = createAsyncThunk<
  Document,
  UpdateDocumentProps,
  { rejectValue: string }
>(
  'data/updateDocument',
  async ({ docId, name, categoryId, order }, { rejectWithValue }) => {
    const req = await fetch(`/api/v1/docs/${docId}`, {
      method: "PATCH",
      headers: {
	'Content-Type': 'application/json',
      },
      // The server is the ultimate arbiter of what changes are allowed and which changes aren't
      body: JSON.stringify({
	name,
	categoryId,
	order
      })
    });
    const res = DocumentOrErrSchema.safeParse(await req.json());
    if (res.success) {
      if ("err" in res.data) {
	return rejectWithValue(res.data.err);
      } else {
	return res.data;
      }
    } else {
      return rejectWithValue(res.error.message);
    }
  }
);


interface CreateDocumentProps {
  file: File;
  name?: string;
  categoryId?: string;
  order?: number
}
/** An async thunk for creating a new Document
 *
 * @param file - required; the backing PDF to send to the server
 * @param name - optional; the new name for the document. Defaults to the file name
 * @param categoryId - optional; the category to put the document in. Defaults to either the first category based on `order`.
 * @param order - optional; a new index for the document in the appropriate category. Rejects if out of bounds.
 * @returns a new `Document`
 */
export const createDocument = createAsyncThunk<
  EnhancedDocument,
  CreateDocumentProps,
  { rejectValue: string, state: RootState }
>(
  'data/createDocument',
  async ({ file: _1, name: _2, categoryId: _3, order: _4 }, { rejectWithValue, getState }) => {
    const state = getState();
    if (state.categories.status === "success") {
      return {
	id: "NOT-A-NANOID",
	name: 'Bee Movie',
	numpages: 1, 
	completed: true,
	s3key: 'ec05b36a4a68b40d3b4f8195907d2a64201672fd14d96a4502c679813288bcb8',
	bookmarks: [
	  {
	    id: "NOT-A-NANOID-BOOKMARK",
	    page: 0,
            audiotime: 0,
            order: 0,
	    documentId: "NOT-A-NANOID"
	  }
	],
	order: 0,
	isPlaying: false,
	playbackSpeed: "1",
	categoryId: Object.keys(state.categories.categories)[0]
      }
    } else {
      return rejectWithValue("Cannot create a document while the documents list is still pending!");
    }
    
    /*
    const state = getState();
    if (name === undefined) {
      name = file.name.replace(/\.pdf$/, "");
    }
    if (categoryId === undefined) {
      if (state.categories.status === "success") {
	categoryId = Object.values(state.categories.categories).find(c => c?.order === 0)?.id;
      }
    }

    const req = await fetch(`/api/v1/docs`, {
      method: "POST",
      headers: {
	'Content-Type': 'application/json',
      },
      // The server is the ultimate arbiter of what changes are allowed and which changes aren't
      body: JSON.stringify({
	name,
	categoryId,
	order
      })
    });
    const res = DocumentOrErrSchema.safeParse(await req.json());
    if (res.success) {
      if ("err" in res.data) {
	return rejectWithValue(res.data.err);
      } else {
	return res.data;
      }
    } else {
      return rejectWithValue(res.error.message);
    }
    */
  }
);

interface UpsertCategoryProps {
  categoryId?: string,
  name?: string,
  color?: string,
  order?: number
}

const CategoryOrErrSchema = z.union([CategorySchema, ErrSchema]);
/** An async thunk for modifying categories
 *
 * @param categoryId - optional; which Category to modify. Returns an error if the id is provided and the associated category does not exist. If omitted, a new category is created.
 * @param name - optional if updating; the new name for the category.
 * @param color - optional if updating; the new color for the category.
 * @param order - optional; which index to store the category at. Rejects if out of bounds.
 * @returns a new `Category`
 */
export const upsertCategory = createAsyncThunk<
  Category,
  UpsertCategoryProps,
  { rejectValue: string }
>(
  'data/upsertCategory',
  async ({ categoryId, name, color, order }, { rejectWithValue }) => {
    const slug = categoryId === undefined ? "" : `/${categoryId}`;
    const req = await fetch(`/api/v1/categories${slug}`, {
      method: categoryId === undefined ? "POST" : "PATCH",
      headers: {
	'Content-Type': 'application/json',
      },
      body: JSON.stringify({
	name,
	color,
	order
      })
    });
    const res = CategoryOrErrSchema.safeParse(await req.json());
    if (res.success) {
      if ("err" in res.data) {
	return rejectWithValue(res.data.err);
      } else {
	return res.data;
      }
    } else {
      return rejectWithValue(res.error.message);
    }
  }
);

/** An async thunk for deleting categories
 *
 * @param id - required; which Category to delete.
 * @returns void
 */
export const deleteCategory = createAsyncThunk<
  string,
  { id: string },
  { rejectValue: string }
>(
  'data/deleteCategory',
  async ({ id }, { rejectWithValue }) => {
    const req = await fetch(`/api/v1/categories/${id}`, {
      method: "DELETE"
    });
    if (req.status !== 204) {
      const res = ErrSchema.safeParse(await req.json());
      if (res.success) {
	return rejectWithValue(res.data.err);
      } else {
	return rejectWithValue(res.error.message);
      }
    } else {
      return id;
    }
  }
);

/** An async thunk for deleting documents
 *
 * @param id - required; which Document to delete.
 * @returns void
 */
export const deleteDocument = createAsyncThunk<
  string,
  { id: string },
  { rejectValue: string }
>(
  'data/deleteDocument',
  async ({ id }, { rejectWithValue }) => {
    const req = await fetch(`/api/v1/docs/${id}`, {
      method: "DELETE"
    });
    if (req.status !== 204) {
      const res = ErrSchema.safeParse(await req.json());
      if (res.success) {
	return rejectWithValue(res.data.err);
      } else {
	return rejectWithValue(res.error.message);
      }
    } else {
      return id;
    }
  }
);

export const selectCategories = createSelector(
  [(state: RootState) => state.categories],
  (categoriesState) => {
    if (categoriesState.status !== 'success') return {};

    const { categories, documents } = categoriesState;

    return Object.values(categories).reduce<Record<string, Category & { documents: EnhancedDocument[] }>>(
      (acc, category) => {
        if (category) {
          const relatedDocuments = Object.values(documents).filter(
            (doc): doc is EnhancedDocument => doc?.categoryId === category.id
          );

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
