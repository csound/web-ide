import { useEffect } from "react";
import { useDispatch } from "@root/store";
import { Header } from "@comp/header/header";
import AddIcon from "@mui/icons-material/Add";
import Button from "@mui/material/Button";
import { addProject } from "@comp/profile/actions";
import Search from "./search";
import PopularProjects from "./popular-projects";
import RandomProjects from "./random-projects";
import PopularArtists from "./popular-artists";
import { homeBackground } from "./background-style";
import { homeContent, homeCreateButton, communityColumns } from "./styles";

const Home = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        // start at top on init
        window.scrollTo(0, 0);
        const rootElement = document.querySelector("#root");
        rootElement && rootElement.scrollTo(0, 0);
        document.title = "Csound Web-IDE";
    }, []);

    return (
        <>
            <Header />
            <main css={homeBackground}>
                <div css={homeContent}>
                    <Search
                        actions={
                            <Button
                                css={homeCreateButton}
                                color="inherit"
                                onClick={() => dispatch(addProject())}
                                startIcon={<AddIcon />}
                            >
                                New Project
                            </Button>
                        }
                    />
                    <div css={communityColumns}>
                        <PopularArtists />
                        <PopularProjects />
                    </div>
                    <RandomProjects />
                </div>
            </main>
        </>
    );
};

export default Home;
