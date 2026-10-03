import React, { lazy, Suspense } from "react";
import { Provider } from "react-redux";
import { createRoot } from "react-dom/client";
import { EmbedApp } from "./components/embed/embed-app";
import { store } from "@root/store";

import "./config/firestore"; // import for sideffects
import "react-perfect-scrollbar/dist/css/styles.css";

const container = document.getElementById("root");
const root = createRoot(container as any);
const isEmbed = /^\/embed(?:\/|$)/.test(window.location.pathname);
// Editor-only packages may access storage while their modules load.
const Main = lazy(() => import("./components/main/main"));

root.render(
    <React.StrictMode>
        <Provider store={store}>
            {isEmbed ? (
                <EmbedApp />
            ) : (
                <Suspense fallback={null}>
                    <Main />
                </Suspense>
            )}
        </Provider>
    </React.StrictMode>
);
