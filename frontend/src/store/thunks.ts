import { createAsyncThunk } from '@reduxjs/toolkit';
import { setCreds, setCategories, authFail, docsFail } from ".";
import { ReshapedCategory } from './slices/categories';
import { Document } from '@/types';

const BASE = "/api/v1";

export const fetchData = createAsyncThunk(
  'data/fetchData',
  async (_, { dispatch }) => {
    try {
      const method = document.cookie.includes("userId") ? "GET" : "POST";
      
      const req  = await fetch(`${BASE}/auth`, { method });
      const resp = await req.json();
      dispatch(setCreds(resp));
    } catch (e) {
      if (typeof e === "string") {
	dispatch(authFail(e));
      }
      return;
    }

    try {
      const docsReq = await fetch(`${BASE}/docs`);
      const docsResp: Document[] = await docsReq.json();
      
      const reshapedCategories: ReshapedCategory[] = Object.values(
	docsResp.reduce((acc, doc) => {
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
      
      dispatch(setCategories(reshapedCategories));
    } catch (e) {
      if (typeof e === "string") {
	dispatch(docsFail(e));
      }
    }
  }
);
