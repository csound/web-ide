import { BrowserRouter, Route, Routes, useParams } from "react-router";
import ThemeProvider from "@styles/theme-provider";
import { EmbedPlayer } from "./embed-player";

const ProjectEmbed = () => {
    const { id = "" } = useParams();
    return <EmbedPlayer key={id} projectUid={id} />;
};

// The player has no login observer, editor shortcuts, or WebMCP tools.
export const EmbedApp = () => (
    <ThemeProvider>
        <BrowserRouter>
            <Routes>
                <Route path="/embed/:id" element={<ProjectEmbed />} />
                <Route path="*" element={<EmbedPlayer projectUid="" />} />
            </Routes>
        </BrowserRouter>
    </ThemeProvider>
);
