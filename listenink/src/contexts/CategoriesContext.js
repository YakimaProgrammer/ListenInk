import React, { createContext, useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCategories } from './categoriesSlice';

const CategoriesContext = createContext();

export const CategoriesProvider = ({ children }) => {
    const categories = useSelector((state) => state.categories.categories || []);
    const documents = useSelector((state) => state.categories.documents || []);
    const [curDocument, setCurDocument] = useState(null);

    const addNewDocument = (categoryId, newDoc) => {
        // Logic to add a new document
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
