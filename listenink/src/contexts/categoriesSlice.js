import { createSlice } from '@reduxjs/toolkit';

const initialState = [
    {
        name: "Finance",
        id: 0,
        color: "blue",
        documents: [
            {
                name: "Invoice_2023-01",
                id: 0,
                text: "Invoice 2023-01\n\n                    This document serves as an official record of the transaction made between [Your Company Name] and [Client Name] on January 1, 2023. The following outlines the payment details:\n\n                    1. Item Description: Consulting Services\n                    2. Quantity: 1\n                    3. Price: $500.00\n                    4. Tax: $25.00\n                    5. Total Amount Due: $525.00\n\n                    Payment terms:\n                    - Due Date: January 15, 2023\n                    - Payment Method: Wire Transfer\n                    - Account Number: 123456789\n\n                    For any questions, contact finance@yourcompany.com."
            },
            {
                name: "Report_Q4_Annual_Very_Long_Title_Document",
                id: 1,
                text: "Q4 Annual Financial Report\n\n                    Executive Summary: \n                    The fiscal year 2023 concluded with a strong Q4 performance, driven by increased revenue in core business areas and strategic cost- cutting measures.Key metrics include: \n\n - Revenue Growth: 15 % YoY\n - Profit Margins: 22 %\n - Key Investments: Expansion into new markets\n\n                    Detailed Insights: \n - Market Performance: Emerging markets contributed 30 % of total revenue.\n - Cost Reductions: Operational costs were reduced by 12 %, significantly impacting net profit.\n\n                    Recommendations: \n - Continue investment in high - growth markets.\n - Explore automation opportunities for cost efficiency.\n\n                    End of Report."
            },
        ],
    },
    {
        name: "Human Resources",
        id: 1,
        color: "green",
        documents: [
            {
                name: "Employee_Handbook",
                id: 2,
                text: "Employee Handbook\n\n                    Welcome to [Your Company Name]!\n                    \n                    This handbook outlines our company policies, values, and expectations to foster a productive and inclusive workplace.Key sections include: \n\n                    1. Code of Conduct: \n - Treat everyone with respect and professionalism.\n - Follow company communication guidelines.\n                    \n                    2. Benefits and Perks: \n - Health insurance: Comprehensive plans available.\n - Paid Time Off: 20 days annually.\n                    \n                    3. Workplace Safety: \n - Emergency contacts listed on each floor.\n - Regular fire drills and safety training.\n\n                    For further details, visit our HR portal or contact hr @yourcompany.com."
            },
            {
                name: "Onboarding_Checklist_Extra_Long_Name",
                id: 3,
                text: "Onboarding Checklist\n\n                    Welcome to the team! Use this checklist to ensure a smooth onboarding experience: \n\n                    1. Documentation: \n - Submit all required identification and tax forms.\n - Complete employee profile on the HR system.\n                    \n                    2. Training: \n - Attend the virtual orientation session.\n - Complete the first - week training modules on the portal.\n                    \n                    3. Setup: \n - Collect your work ID and badge.\n - Configure your company email and VPN access.\n\n                    For additional support, reach out to onboarding @yourcompany.com."
            },
        ],
    },
    {
        name: "Engineering",
        id: 2,
        color: "orange",
        documents: [
            {
                name: "Architecture_Diagram",
                id: 4,
                text: "System Architecture Diagram\n\n                    Overview: \n                    The architecture comprises three main layers: Frontend, Backend, and Database.\n\n                    1. Frontend: \n                       - React.js framework\n - Hosted on AWS S3 with CloudFront for CDN.\n\n                    2. Backend: \n - Node.js microservices\n - Deployed on Kubernetes with autoscaling enabled.\n\n                    3. Database: \n - PostgreSQL for relational data\n - Redis for caching\n\n                    Refer to the attached visual diagram for detailed layer interactions."
            },
            {
                name: "Development_Guide",
                id: 5,
                text: "Development Guide\n\n                    Coding Standards: \n - Follow the Airbnb JavaScript style guide.\n - Use meaningful variable names and add comments for clarity.\n\n                    Branching Strategy: \n - Use Git Flow for version control.\n - Main branch is always deployment - ready.\n\n                    Testing Requirements: \n - Write unit tests for all new features.\n - Achieve at least 80 % code coverage.\n\n                    Deployment Steps: \n - Merge changes to the main branch.\n - Trigger the CI / CD pipeline on Jenkins.\n\n                    Additional Resources: \n - Refer to the engineering wiki for project - specific details."
            },
            {
                name: "Release_Notes_For_Version_2.0_Beta",
                id: 6,
                text: "Release Notes - Version 2.0 Beta\n\n                    Highlights: \n - New User Interface: Redesigned for enhanced usability.\n - Performance Boost: Backend response times improved by 40 %.\n - New Features: Added real - time notifications and advanced search functionality.\n\n                    Known Issues: \n - Minor UI glitches in dark mode.\n - Intermittent delays in notification delivery.\n\n                    Next Steps: \n - Collect user feedback during the beta phase.\n - Prepare for the official release by resolving known issues.\n\n                    Contact support @yourcompany.com for bug reports or suggestions."
            },
        ],
    },
];


const categoriesSlice = createSlice({
    name: 'categories',
    initialState,
    reducers: {},
});

export const selectCategories = (state) => state.categories;
export default categoriesSlice.reducer;
