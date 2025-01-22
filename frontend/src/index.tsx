import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { Root } from "./pages/Root";
import { Auth } from "./pages/Auth";

// A global css file, but we use css modules for this project for namespacing
import "./index.css";

let router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
  },
  {
    path: "/auth",
    Component: Auth,
  },
]);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
