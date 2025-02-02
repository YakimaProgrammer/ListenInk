import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';
import { PromiseState } from '../helper-types';

type AuthState = PromiseState<User>;

const initialState = { status: "pending" } as AuthState;

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCreds: (state, action: PayloadAction<User>) => {
      if (state.status === "pending") {
	return {
	  status: "success", // Normally, I would write to state directly, but the type checker wants to dance
	  name: action.payload.name,
	  id: action.payload.id,
	  email: action.payload.email
	}
      }
    },

    fail: (_, action: PayloadAction<string>) => {
      return { status: "failure", message: action.payload }
    }
  },
})

export const { setCreds, fail } = authSlice.actions

export default authSlice.reducer
