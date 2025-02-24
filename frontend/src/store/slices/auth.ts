import { z } from "zod";
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, UserSchema, ErrSchema } from '@/types';
import { PromiseState } from '../helper-types';

type AuthState = PromiseState<User>;

const initialState = { status: "pending" } as AuthState;

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state: AuthState) => {
        state.status = 'pending';
      })
      .addCase(fetchProfile.fulfilled, (_, action: PayloadAction<User>) => {
	// Normally, I would use Immer to modify state, but the typechecker has trust issues 
        return {
	  status: "success",
	  ...action.payload
	}
      })
      .addCase(fetchProfile.rejected, (_, action: PayloadAction<string | undefined>) => {
        return {
	  status: "failure",
	  message: action.payload ?? "An unknown error occured!"
	}
      });
  }
});

const UserOrErrSchema = z.union([UserSchema, ErrSchema]);
export const fetchProfile = createAsyncThunk<
  User,
  void,
  { rejectValue: string }
>(
  'data/fetchCreds',
  async (_, { rejectWithValue }) => {
    try {
      const hasCookie = document.cookie.includes("userId");
      const req = await fetch("/api/v1/auth", { method: hasCookie ? "GET" : "POST" });
      const resp = UserOrErrSchema.safeParse(await req.json());
      if (resp.success) {
	if ("err" in resp.data) {
	  console.error(resp.data.err);
	  return rejectWithValue(resp.data.err);
	} else {
	  return resp.data;
	}
      } else {
	console.error(resp.error.message);
	return rejectWithValue("Could not parse user profile info!");
      }
      
    } catch (err) {
      console.error(err);
      return rejectWithValue("Error retrieving user profile info!");
    }
  }
);

export default authSlice.reducer;
