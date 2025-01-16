import { createAsyncThunk } from '@reduxjs/toolkit';
import { setCreds, setCategories, authFail, docsFail } from ".";

export async function fetchCategories() {
  const user = await (await fetch("/api/v1/auth", { method: "POST" })).json();
  const categories = await (await fetch("/api/v1/categories")).json();
}

const BASE = "/api/v1";

export const fetchData = createAsyncThunk(
  'data/fetchData',
  async (_, { dispatch }) => {
    try {
      const req  = await fetch(`${BASE}/auth`, { method: "POST" });
      const resp = await req.json();
      dispatch(setCreds(resp));
    } catch (e) {
      if (typeof e === "string") {
	dispatch(authFail(e));
      }
      return;
    }

    try {
      const req = await fetch(`${BASE}/categories`);
      const resp = await req.json();
    } catch (e) {
      if (typeof e === "string") {
	dispatch(docsFail(e));
      }
    }
  }
);
