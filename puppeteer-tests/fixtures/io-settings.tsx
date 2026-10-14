import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { Button, Stack } from "@mui/material";
import { store } from "../../src/store";
import ThemeProvider from "../../src/styles/theme-provider";
import GlobalModal from "../../src/components/modal";
import { openSimpleModal } from "../../src/components/modal/actions";
import { changeTheme } from "../../src/components/themes/action";

store.dispatch(
    changeTheme(
        new URLSearchParams(location.search).has("light")
            ? "github-light"
            : "github"
    )
);
createRoot(document.getElementById("root")!).render(
    <Provider store={store}>
        <MemoryRouter>
            <ThemeProvider>
                <main>
                    <Stack direction="row" spacing={2} sx={{ p: 3 }}>
                        {(["input", "output", "midi"] as const).map((kind) => (
                            <Button
                                key={kind}
                                onClick={() =>
                                    store.dispatch(
                                        openSimpleModal("io-dialog", { kind })
                                    )
                                }
                            >
                                {kind}
                            </Button>
                        ))}
                    </Stack>
                    <GlobalModal />
                </main>
            </ThemeProvider>
        </MemoryRouter>
    </Provider>
);
