import React from "react";
import "./Sidebar.css";

// Mock data
const categories = [
    {
        name: "Finance",
        color: "blue",
        documents: [
            { id: "Invoice_2023-01" },
            { id: "Report_Q4_Annual_Very_Long_Title_Document" },
        ],
    },
    {
        name: "Human Resources",
        color: "green",
        documents: [
            { id: "Employee_Handbook" },
            { id: "Onboarding_Checklist_Extra_Long_Name" },
        ],
    },
    {
        name: "Engineering",
        color: "orange",
        documents: [
            { id: "Architecture_Diagram" },
            { id: "Development_Guide" },
            { id: "Release_Notes_For_Version_2.0_Beta" },
        ],
    },
];

// Helper function to truncate text
const truncateText = (text, maxLength = 5) => {
    console.log(text.length);
    if (text.length <= maxLength) {
        return text;
    }
    // Show as many characters as possible minus a few, then add "..."
    return text.slice(0, maxLength - 3) + "...";
};

export default function CategoryPage() {
    return (
        <div style={{ margin: "20px" }}>
            <h1>All Categories</h1>
            {categories.map((category, index) => (
                <div key={index} style={{ marginBottom: "16px" }}>
                    <div>
                        <strong style={{ color: category.color }}>
                            {category.name}
                        </strong>
                    </div>

                    <ul style={{ marginLeft: "20px" }}>
                        {category.documents.map((doc, docIndex) => {
                            const truncatedId = truncateText(doc.id, 25); // adjust length as needed
                            return <li key={docIndex}>{truncatedId}</li>;
                        })}
                    </ul>
                </div>
            ))}
        </div>
    );
}
