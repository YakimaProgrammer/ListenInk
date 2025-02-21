import { z } from "zod";
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Category, Document, DocumentSchema, ErrSchema } from '@/types';
import { PromiseState } from '../helper-types';

export type ReducedDoc = Omit<Document, "category">;
export type ReshapedCategory = Category & {documents: ReducedDoc[]};

interface CategoriesSuccessState {
  categories: ReshapedCategory[]
}

export type CategoriesState = PromiseState<CategoriesSuccessState>;

const initialState = { status: "pending" } as CategoriesState;

export const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (state: CategoriesState) => {
        state.status = 'pending';
      })
      .addCase(fetchDocuments.fulfilled, (_, action: PayloadAction<ReshapedCategory[]>) => {
	// Normally, I would use Immer to modify state, but the typechecker has trust issues 
        return {
	  status: "success",
	  categories: action.payload
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

const DocumentOrErrSchema = z.union([z.array(DocumentSchema), ErrSchema]);
export const fetchDocuments = createAsyncThunk<
  ReshapedCategory[],
  void,
  { rejectValue: string }
>(
  'data/fetchDocuments',
  async (_, { rejectWithValue }) => {
    try {
      const req = await fetch("/api/v1/docs");
      const resp = DocumentOrErrSchema.safeParse(await req.json());
      if (resp.success) {
	if ("err" in resp.data) {
	  return rejectWithValue(resp.data.err);
	} else {
	  // Maps an array of documents pointing to categories to
	  // an array of categories containing documents.
	  const reshapedCategories: ReshapedCategory[] = Object.values(
	    resp.data.reduce((acc, doc) => {
	      // Destructure to remove the category from the document (so we don't duplicate it)
	      const { category, ...documentWithoutCategory } = doc;

	      // If we haven't seen this category before, initialize it
	      if (!acc[category.id]) {
		acc[category.id] = { ...category, documents: [] };
	      }
	      // Add the document (without its category) to the appropriate category group
	      acc[category.id].documents.push(documentWithoutCategory);

	      return acc;
	    }, {} as Record<string, ReshapedCategory>)
	  );
	  return reshapedCategories;
	}
      } else {
	return rejectWithValue("Could not parse document info!");
      }
      
    } catch (err) {
      return rejectWithValue("Error retrieving document info!");
    }
  }
);

export default categoriesSlice.reducer;
