import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { StyledEngineProvider } from "@mui/material/styles";
import { Provider } from "react-redux";
import { store } from "./store";
import { urlFor } from "./pages/urlfor";

// Components
import { Root } from "./pages/Root";
import { Auth } from "./pages/Auth";

// A global css file, but we use css modules for this project for namespacing
import "./index.css";
import "bootstrap-icons/font/bootstrap-icons.css";

let router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
  },
  {
    path: urlFor("docs", ":docId"),
    Component: Root,
  },
  {
    path: "/auth",
    Component: Auth,
  },
]);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    </StyledEngineProvider>
  </React.StrictMode>
);
