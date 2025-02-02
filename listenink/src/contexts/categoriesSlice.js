import { createSlice } from '@reduxjs/toolkit';

// Separate lists for categories and documents
const initialCategories = [
    { id: 0, name: "Uncategorized", documents: [] },
    { id: 1, name: "Finance", color: "#005f73", documents: [0, 1] },
    { id: 2, name: "Human Resources", color: "#0a9396", documents: [2, 3] },
    { id: 3, name: "Engineering", color: "#94d2bd", documents: [4, 5] },
];

const initialDocuments = [
    {
        id: 0,
        name: "Invoice_2023-01",
        text: `Invoice 2023-01\n\nThis document serves as an official record of the transaction made between [Your Company Name] and [Client Name] on January 1, 2023. 
        The following outlines the payment details:\n\n1. Item Description: Consulting Services\n2. Quantity: 1\n3. Price: $500.00\n4. Tax: $25.00\n5. Total Amount Due: $525.00\n\nPayment terms:\n- Due Date: January 15, 2023\n- Payment Method: Wire Transfer\n- Account Number: 123456789\n\nFor any questions, contact finance@yourcompany.com.`,
    },
    {
        id: 1,
        name: "Report_Q4_Annual_Very_Long_Title_Document",
        text: `Q4 Annual Financial Report\n\nExecutive Summary:\nThe fiscal year 2023 concluded with a strong Q4 performance, driven by increased revenue in core business areas and strategic cost-cutting measures.
        Key metrics include:\n\n- Revenue Growth: 15% YoY\n- Profit Margins: 22%\n- Key Investments: Expansion into new markets\n\nDetailed Insights:\n- Market Performance: Emerging markets contributed 30% of total revenue.\n- Cost Reductions: Operational costs were reduced by 12%, significantly impacting net profit.\n\nRecommendations:\n- Continue investment in high-growth markets.\n- Explore automation opportunities for cost efficiency.\n\nEnd of Report.`,
    },
    {
        id: 2,
        name: "Employee_Handbook",
        text: `Employee Handbook\n\nWelcome to [Your Company Name]!\n\nThis handbook outlines our company policies, values, and expectations to foster a productive and inclusive workplace. Key sections include:\n\n1. Code of Conduct:\n- Treat everyone with respect and professionalism.\n- Follow company communication guidelines.\n\n2. Benefits and Perks:\n- Health insurance: Comprehensive plans available.\n- Paid Time Off: 20 days annually.\n\n3. Workplace Safety:\n- Emergency contacts listed on each floor.\n- Regular fire drills and safety training.\n\nFor further details, visit our HR portal or contact hr@yourcompany.com.`,
    },
    {
        id: 3,
        name: "Onboarding_Checklist_Extra_Long_Name",
        text: `Onboarding Checklist\n\nWelcome to the team! Use this checklist to ensure a smooth onboarding experience:\n\n1. Documentation:\n- Submit all required identification and tax forms.\n- Complete employee profile on the HR system.\n\n2. Training:\n- Attend the virtual orientation session.\n- Complete the first-week training modules on the portal.\n\n3. Setup:\n- Collect your work ID and badge.\n- Configure your company email and VPN access.\n\nFor additional support, reach out to onboarding@yourcompany.com.`,
    },
    {
        id: 4,
        name: "Architecture_Diagram",
        text: `System Architecture Diagram\n\nOverview:\nThe architecture comprises three main layers: Frontend, Backend, and Database.\n\n1. Frontend:\n- React.js framework\n- Hosted on AWS S3 with CloudFront for CDN.\n\n2. Backend:\n- Node.js microservices\n- Deployed on Kubernetes with autoscaling enabled.\n\n3. Database:\n- PostgreSQL for relational data\n- Redis for caching\n\nRefer to the attached visual diagram for detailed layer interactions.`,
    },
    {
        id: 5,
        name: "Development_Guide",
        text: `Development Guide\n\nCoding Standards:\n- Follow the Airbnb JavaScript style guide.\n- Use meaningful variable names and add comments for clarity.\n\nBranching Strategy:\n- Use Git Flow for version control.\n- Main branch is always deployment-ready.\n\nTesting Requirements:\n- Write unit tests for all new features.\n- Achieve at least 80% code coverage.\n\nDeployment Steps:\n- Merge changes to the main branch.\n- Trigger the CI/CD pipeline on Jenkins.\n\nAdditional Resources:\n- Refer to the engineering wiki for project-specific details.`,
    },
];

const categoriesSlice = createSlice({
    name: 'categories',
    initialState: { categories: initialCategories, documents: initialDocuments },
    reducers: {

        renameCategory: (state, action) => {
            const { categoryId, newName } = action.payload;
            const cat = state.categories.find((c) => c.id === categoryId);
            if (cat) {
                cat.name = newName;
            }
        },
        deleteCategory: (state, action) => {
            const categoryId = action.payload;
            // Remove the category
            state.categories = state.categories.filter((c) => c.id !== categoryId);
            // Optionally, also handle any documents that belonged to that category
            // e.g. move them to "Uncategorized" or remove them entirely
            // up to you
        },

        renameDocument: (state, action) => {
            const { docId, newName } = action.payload;
            const doc = state.documents.find((d) => d.id === docId);
            if (doc) doc.name = newName;
        },

        updateDocumentName: (state, action) => {
            const { docId, newName } = action.payload;
            const doc = state.documents.find((d) => d.id === docId);
            if (doc) doc.name = newName;
        },

        deleteDocument: (state, action) => {
            const docId = action.payload;
            // Remove from state.documents
            state.documents = state.documents.filter((d) => d.id !== docId);
            // Also remove from whichever category’s documents array
            state.categories.forEach((cat) => {
                cat.documents = cat.documents.filter((id) => id !== docId);
            });
        },


        addDocument: (state, action) => {
            const { document } = action.payload;
            state.documents.push(document);

            // console.log(document.id);
            // const newDocument = { ...document };
            // state.documents.push(newDocument);
            const uncategorizedCategory = state.categories.find(cat => cat.name === "Uncategorized");
            if (uncategorizedCategory) {
                // uncategorizedCategory.documents.push(newDocument.id);
                uncategorizedCategory.documents.push(document.id);
            }
        },

        // NEW REDUCER
        moveDocument: (state, action) => {
            const { docId, sourceCategoryId, targetCategoryId } = action.payload;

            // Do nothing if user drops onto the same category
            if (sourceCategoryId === targetCategoryId) return;

            // Find source category
            const sourceCategory = state.categories.find(cat => cat.id === parseInt(sourceCategoryId));
            // Remove doc from source
            if (sourceCategory) {
                sourceCategory.documents = sourceCategory.documents.filter(id => id !== parseInt(docId));
            }

            // Find target category
            const targetCategory = state.categories.find(cat => cat.id === parseInt(targetCategoryId));
            // Add doc to target
            if (targetCategory) {
                targetCategory.documents.push(parseInt(docId));
            }
        },

        addCategory: (state, action) => {
            const newCategory = action.payload;
            state.categories.push({
                ...newCategory,
                documents: [],
                color: "#000000"
            });
        },

        changeCategoryColor: (state, action) => {
            const { categoryId, color } = action.payload;
            const cat = state.categories.find((c) => c.id === categoryId);
            if (cat) {
                cat.color = color;
            }
        },

        reorderCategories: (state, action) => {
            const { categoryId, referenceCategoryId, position } = action.payload;
            // position is either 'before' or 'after'
            const arr = state.categories;
            const fromIndex = arr.findIndex((c) => c.id === categoryId);
            const toIndex = arr.findIndex((c) => c.id === referenceCategoryId);

            // if either ID wasn't found, no-op
            if (fromIndex === -1 || toIndex === -1) return;

            // remove the "moved" category
            const [moved] = arr.splice(fromIndex, 1);

            // re-insert it before or after the reference
            const insertIndex = position === 'before' ? toIndex : toIndex + 1;
            arr.splice(insertIndex, 0, moved);
        },
    },
});

export const {
    addDocument,
    moveDocument,
    updateDocumentName,
    addCategory,
    renameCategory,
    deleteCategory,
    renameDocument,
    deleteDocument,
    changeCategoryColor,
    reorderCategories
} = categoriesSlice.actions;

// export const selectCategories = (state) => state.categories.categories;
// export const selectDocumentsByCategory = (state, categoryId) => state.categories.documents.filter((doc) => doc.categoryId === categoryId);

export default categoriesSlice.reducer;
