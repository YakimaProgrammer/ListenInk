import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, createBrowserRouter, Route, Router, RouterProvider, Routes } from "react-router";
import { StyledEngineProvider } from "@mui/material/styles";
import { Provider } from "react-redux";
import { store } from "./store";
import { urlFor } from "./pages/urlfor";

// Components
import { Root } from "./pages/Root";
import { Auth } from "./pages/Auth/Auth";
import MainPage from "./pages/MainPage";

// A global css file, but we use css modules for this project for namespacing
import "./index.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Login, Dashboard } from "@mui/icons-material";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./pages/Auth/AuthContext";
import ProtectedRoute from "./pages/Auth/ProtectedRoute";

const CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID";

// let router = createBrowserRouter([
//   {
//     path: "/",
//     Component: Root,
//   },
//   {
//     path: urlFor("docs", ":docId"),
//     Component: Root
//   },
//   {
//     path: "/auth",
//     Component: Auth,
//   },
// ]);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <GoogleOAuthProvider clientId={"836845435178-oaeinjfucvl53c46r6c2drc008m08cbn.apps.googleusercontent.com"}>
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<MainPage />} />
                        <Route path="/login" element={<Auth />} />
                        <Route path="/dashboard" element={<ProtectedRoute><Root /></ProtectedRoute>} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </GoogleOAuthProvider>
);
