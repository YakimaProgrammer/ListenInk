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
  try {
    const hasCookie = document.cookie.includes("userId");
    const req = await fetch("/api/v1/auth", {
      method: hasCookie ? "GET" : "POST",
    });
    const resp = UserOrErrSchema.safeParse(await req.json());

    if (resp.success) {
      if ("err" in resp.data) {
        console.warn("[AUTH] Session expired. Attempting re-authentication.");
        document.cookie =
          "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"; // Clear invalid cookies
        return await reAuthenticate();
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
});

async function reAuthenticate(): Promise<User> {
  const req = await fetch("/api/v1/auth", { method: "POST" }); // Force a new session
  const resp = UserOrErrSchema.safeParse(await req.json());

  if (resp.success) {
    if ("err" in resp.data) {
      throw new Error("[AUTH] Failed to re-authenticate: " + resp.data.err);
    } else {
      console.log("[AUTH] Successfully re-authenticated.");
      return resp.data;
    }
  } else {
    throw new Error("[AUTH] Re-authentication failed.");
  }
}

export default authSlice.reducer;
