import React from "react";
import { Provider as Provider_ } from "react-redux";
import { createRoot } from "react-dom/client";
import Main from "./components/main/main";
import { store } from "@root/store";

import "./config/firestore"; // import for sideffects
import "react-perfect-scrollbar/dist/css/styles.css";

/* eslint-disable-next-line unicorn/prefer-query-selector */
const container = document.getElementById("root");
const root = createRoot(container as any);
const Provider = Provider_ as any;
root.render(
    <>
        <Provider store={store}>
            <Main />
        </Provider>
    </>
);
