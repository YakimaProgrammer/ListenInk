import React, { createContext, useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import store from './store';
import { selectCategories, addDocument } from './categoriesSlice';

const CategoriesContext = createContext();

export const CategoriesProvider = ({ children }) => {
    const categories = useSelector((state) => state.categories.categories || []);
    const documents = useSelector((state) => state.categories.documents || []);
    const [curDocument, setCurDocument] = useState(null);

    const addNewDocument = (newDoc) => {
        store.dispatch(addDocument({ document: newDoc }));
    };

    return (
        <CategoriesContext.Provider
            value={{ categories, documents, curDocument, setCurDocument, addNewDocument }}
        >
            {children}
        </CategoriesContext.Provider>
    );
};

export const useCategories = () => useContext(CategoriesContext);
