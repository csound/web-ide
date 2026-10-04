// Fictional projects only. Browser tests block all cloud requests.
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { Tabs, Tab, Typography } from "@mui/material";
import { store } from "../../src/store";
import ThemeProvider from "../../src/styles/theme-provider";
import { ProjectCard } from "../../src/components/home/project-card";
import { ProfileProjects } from "../../src/components/profile/profile-projects";
import {
    ProfileContainer,
    ContentSection,
    ContentTabsContainer,
    NameSectionWrapper
} from "../../src/components/profile/profile-ui";
import type { IProject } from "../../src/components/projects/types";

const projects: IProject[] = [
    {
        name: "Glass bells",
        description: "Soft tones with long decays.",
        tags: ["synthesis", "ambient"]
    },
    {
        name: "Granular study",
        description: "Small fragments of field recordings.",
        tags: ["synthesis", "granular"]
    },
    {
        name: "Étude for prepared piano and electronics",
        description: "A study in slow, shifting harmonics.",
        tags: ["ambient", "live performance"]
    },
    {
        name: "Private sketch",
        description: "Work in progress.",
        tags: ["private-tag"],
        isPublic: false
    }
].map((project, index) => ({
    projectUid: `fixture-${index}`,
    userUid: "fixture-author",
    documents: {},
    stars: {},
    isPublic: true,
    created: new Date(2024, 4, 10 + index).getTime(),
    iconName: "MusicNote",
    iconBackgroundColor: "#314f60",
    iconForegroundColor: "#ffffff",
    ...project
}));
store.dispatch({ type: "PROJECTS.STORE_PROJECT_LOCALLY", projects });
const owner = new URLSearchParams(location.search).has("owner");
createRoot(document.getElementById("root")!).render(
    <Provider store={store}>
        <MemoryRouter>
            <ThemeProvider>
                {new URLSearchParams(location.search).has("cards") ? (
                    <main
                        style={{
                            maxWidth: 340,
                            margin: "16px auto",
                            padding: "0 12px",
                            display: "grid",
                            gap: 16
                        }}
                    >
                        {[
                            projects[0],
                            {
                                ...projects[1],
                                tags: [
                                    "a-very-long-tag-for-granular-synthesis",
                                    ...Array.from(
                                        { length: 30 },
                                        (_, i) => `tag-${i + 1}`
                                    )
                                ]
                            },
                            { ...projects[2], tags: [] }
                        ].map((project, projectIndex) => (
                            <ProjectCard
                                key={project.projectUid}
                                project={project}
                                projectIndex={projectIndex}
                                profile={{
                                    userUid: "fixture-author",
                                    username: "fixture-author",
                                    displayName: "Marta Nowak",
                                    bio: "Sound studies"
                                }}
                            />
                        ))}
                    </main>
                ) : (
                    <ProfileContainer>
                        <NameSectionWrapper>
                            <Typography variant="h4">Marta Nowak</Typography>
                            <Typography>
                                Sound studies and instruments
                            </Typography>
                        </NameSectionWrapper>
                        <ContentSection>
                            <ContentTabsContainer>
                                <Tabs value={0}>
                                    <Tab label="Projects" />
                                    <Tab label="Stars" />
                                    <Tab label="Following" />
                                </Tabs>
                            </ContentTabsContainer>
                            <ProfileProjects
                                profileUid="fixture-author"
                                projects={projects}
                                isProfileOwner={owner}
                            />
                        </ContentSection>
                    </ProfileContainer>
                )}
            </ThemeProvider>
        </MemoryRouter>
    </Provider>
);
