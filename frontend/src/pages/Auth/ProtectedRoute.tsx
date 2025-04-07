import React, { ReactNode, useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";

interface ProtectedRouteProps {
    children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const auth = useContext(AuthContext);

    if (!auth?.user) {
        return <Navigate to="/login" replace />; // Redirect if not logged in
    }

    return <>{children}</>; // ✅ Ensure this returns JSX
};

export default ProtectedRoute;
