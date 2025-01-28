// CategoriesContext.js
import React, { createContext, useContext, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import store from './store';
import { addDocument, updateDocumentName, addCategory } from './categoriesSlice';

const CategoriesContext = createContext();

export const CategoriesProvider = ({ children }) => {
    const dispatch = useDispatch();

    const categories = useSelector((state) => state.categories.categories || []);

    // 2) Keep using Redux for official "documents"
    //    (If you remove this, your page may crash because other parts rely on it.)
    const documents = useSelector((state) => state.categories.documents || []);

    // 3) The "current" document you are viewing
    const [curDocument, setCurDocument] = useState(null);

    const [pdfByDocId, setPdfByDocId] = useState({});
    const addNewDocument = (newDoc) => {
        store.dispatch(addDocument({ document: newDoc }));
        const newDocument = { ...newDoc };
        setCurDocument(newDocument);
    };

    const addNewCategory = (cat) => {
        store.dispatch(addCategory(cat));
    }

    // 2) Function to store PDF in state
    const attachPdfToDocument = (docId, file) => {
        setPdfByDocId((prev) => ({
            ...prev,
            [docId]: file
        }));
    };

    // 5) Example: rename a document
    const renameDocument = (docId, newName) => {
        // This calls the *Redux action*, not itself
        dispatch(updateDocumentName({ docId, newName }));
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
                attachPdfToDocument,
                renameDocument,
                addNewCategory,
            }}
        >
            {children}
        </CategoriesContext.Provider>
    );
};

export const useCategories = () => useContext(CategoriesContext);
