import React, { useState } from "react";
import "./Search.css";
import { useCategories } from "../../contexts/CategoriesContext";

export default function Search() {
    const { documents, curDocument, setCurDocument } = useCategories();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    const handleSearch = (query) => {
        setSearchQuery(query);
        const results = documents.filter(
            (doc) =>
                doc.name.toLowerCase().includes(query.toLowerCase()) ||
                doc.text.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(results);
    };

    return (
        <div className="search-container">
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search documents..."
                className="search-input"
            />

            {searchQuery && (
                <div className="search-results">
                    {searchResults.length > 0 ? (
                        searchResults.map((doc) => (
                            <button
                                key={doc.id}
                                onClick={() => setCurDocument(doc)}
                                className={`search-result ${
                                    curDocument?.id === doc.id ? "active" : ""
                                }`}
                            >
                                {doc.name}
                            </button>
                        ))
                    ) : (
                        <p className="no-results">No documents found</p>
                    )}
                </div>
            )}
        </div>
    );
}
