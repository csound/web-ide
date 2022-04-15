import React from "react";
import ReactDOM from "react-dom";
import * as serviceWorker from "./service-worker";
import Main from "./components/main/main";

import "./config/firestore"; // import for sideffects
import "react-perfect-scrollbar/dist/css/styles.css";

// INITIALIZE REACT RENDERING
ReactDOM.render(<Main />, document.querySelector("#root"));

serviceWorker.unregister();
