// frontend/src/store/slices/auth.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { User, UserOrErrSchema } from "@/types";
import { PromiseState } from "../helper-types";

type AuthState = PromiseState<User>;

const initialState = { status: "pending" } as AuthState;

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state: AuthState) => {
        state.status = "pending";
      })
      .addCase(fetchProfile.fulfilled, (_, action: PayloadAction<User>) => {
        return {
          status: "success",
          ...action.payload,
        };
      })
      .addCase(
        fetchProfile.rejected,
        (_, action: PayloadAction<string | undefined>) => {
          return {
            status: "failure",
            message: action.payload ?? "An unknown error occured!",
          };
        }
      );

    builder
      .addCase(logout.fulfilled, () => {
        return {
          status: "failure",
          message: "Logged out!"
        };
      })
      .addCase(
        logout.rejected,
        (_, action: PayloadAction<string | undefined>) => {
          return {
            status: "failure",
            message: action.payload ?? "An unknown error occured!",
          };
        }
      );
  },
});

export const fetchProfile = createAsyncThunk<
  User,
  void,
  { rejectValue: string }
>("data/fetchCreds", async (_, { rejectWithValue }) => {
  try {
    const req = await fetch("/api/v1/auth");
    const parseResult = UserOrErrSchema.safeParse(await req.json());

    if (parseResult.success) {
      if (parseResult.data.success) {
        return parseResult.data.data;
      } else {
	return rejectWithValue(parseResult.data.err);
      }
    } else {
      console.error(parseResult.error.message);
      return rejectWithValue(parseResult.error.message);
    }
  } catch (err) {
    console.error(err);
    return rejectWithValue("Error retrieving user profile info!");
  }
});

export const logout = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>("data/logout", async (_, { rejectWithValue }) => {
  try {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    return;
  } catch (err) {
    console.error(err);
    return rejectWithValue("Error retrieving user profile info!");
  }
});

export default authSlice.reducer;
