// CategoriesContext.js
import React, { createContext, useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import store from './store';
import { addDocument } from './categoriesSlice';

const CategoriesContext = createContext();

export const CategoriesProvider = ({ children }) => {
    const categories = useSelector((state) => state.categories.categories || []);
    const documents = useSelector((state) => state.categories.documents || []);
    const [curDocument, setCurDocument] = useState(null);

    // 1) A map from docId -> PDF File object (or you could store base64, Blob URL, etc.)
    const [pdfByDocId, setPdfByDocId] = useState({});

    const addNewDocument = (newDoc) => {
        store.dispatch(addDocument({ document: newDoc }));
        const newDocument = { ...newDoc };
        setCurDocument(newDocument);
    };

    // 2) Function to store PDF in state
    const attachPdfToDocument = (docId, file) => {
        setPdfByDocId((prev) => ({
            ...prev,
            [docId]: file
        }));
    };

    return (
        <CategoriesContext.Provider
            value={{
                categories,
                documents,
                curDocument,
                setCurDocument,
                addNewDocument,
                // expose new state & function
                pdfByDocId,
                attachPdfToDocument
            }}
        >
            {children}
        </CategoriesContext.Provider>
    );
};

export const useCategories = () => useContext(CategoriesContext);
