import React, { createContext, useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCategories } from './categoriesSlice';

const CategoriesContext = createContext();

export const CategoriesProvider = ({ children }) => {
    const categories = useSelector(selectCategories) || []; // Ensure default array
    const [curDocument, setCurDocument] = useState(0);

    return (
        <CategoriesContext.Provider value={{ categories, curDocument, setCurDocument }}>
            {children}
        </CategoriesContext.Provider>
    );
};


export const useCategories = () => useContext(CategoriesContext);
