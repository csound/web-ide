// Browser tests supply public profile fixtures and block all cloud requests.
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { store } from "../../src/store";
import ThemeProvider from "../../src/styles/theme-provider";
import Home from "../../src/components/home/home";

createRoot(document.getElementById("root")!).render(
    <Provider store={store}>
        <MemoryRouter>
            <ThemeProvider>
                <Home />
            </ThemeProvider>
        </MemoryRouter>
    </Provider>
);
