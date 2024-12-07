import { Provider } from "react-redux";
import { createRoot } from "react-dom/client";
import Main from "./components/main/main";
import { store } from "@root/store";

import "./config/firestore"; // import for sideffects
import "react-perfect-scrollbar/dist/css/styles.css";

const container = document.getElementById("root");
const root = createRoot(container as any);

root.render(
    <Provider store={store}>
        <Main />
    </Provider>
);
