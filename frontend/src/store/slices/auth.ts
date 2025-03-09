// frontend/src/store/slices/auth.ts
import { z } from "zod";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { User, UserSchema, ErrSchema } from "@/types";
import { PromiseState } from "../helper-types";
import { apiClient } from "@/api/client"; // Import our new apiClient

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
  },
});

const UserOrErrSchema = z.union([UserSchema, ErrSchema]);
export const fetchProfile = createAsyncThunk<
  User,
  void,
  { rejectValue: string }
>("data/fetchCreds", async (_, { rejectWithValue }) => {
  const maxAttempts = 3;
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      const hasCookie = document.cookie.includes("userId");
      console.log(`Auth attempt ${attempt}, has cookie: ${hasCookie}`);

      // Use our apiClient instead of fetch directly
      const req = await apiClient("auth", {
        method: hasCookie ? "GET" : "POST",
      });

      console.log("Auth response status:", req.status);

      const data = await req.json();
      const resp = UserOrErrSchema.safeParse(data);

      if (resp.success) {
        if ("err" in resp.data) {
          console.error(resp.data.err);
          // If this is the last attempt, reject with the error
          if (attempt >= maxAttempts) {
            return rejectWithValue(resp.data.err);
          }
        } else {
          return resp.data;
        }
      } else {
        console.error(resp.error.message);
        if (attempt >= maxAttempts) {
          return rejectWithValue("Could not parse user profile info!");
        }
      }
    } catch (err) {
      console.error(err);
      if (attempt >= maxAttempts) {
        return rejectWithValue("Error retrieving user profile info!");
      }
    }

    // Wait before retrying
    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return rejectWithValue("Max attempts reached");
});

export default authSlice.reducer;
