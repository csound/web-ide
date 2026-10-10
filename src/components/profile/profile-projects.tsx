import { useMemo, useState } from "react";
import {
    Autocomplete,
    Box,
    Button,
    InputAdornment,
    TextField,
    Typography
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import { useDispatch, useSelector } from "@root/store";
import type { IProject } from "@comp/projects/types";
import { addProject, setProjectFilterString } from "./actions";
import { selectProjectFilterString } from "./selectors";
import { ProfileLists } from "./profile-lists";
import { ListContainer, contentActionsStyle } from "./profile-ui";
import {
    availableProjectTags,
    filterProfileProjects,
    normalizeProjectText
} from "./project-filters";

export function ProfileProjects({
    profileUid,
    projects,
    isProfileOwner
}: {
    profileUid: string;
    projects: IProject[];
    isProfileOwner: boolean;
}) {
    const dispatch = useDispatch();
    const query = useSelector(selectProjectFilterString) || "";
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const visibleProjects = useMemo(
        () => projects.filter((project) => isProfileOwner || project.isPublic),
        [projects, isProfileOwner]
    );
    const options = useMemo(
        () => availableProjectTags(visibleProjects),
        [visibleProjects]
    );
    const filtered = useMemo(
        () => filterProfileProjects(visibleProjects, query, selectedTags),
        [visibleProjects, query, selectedTags]
    );
    const hasFilter = !!query.trim() || selectedTags.length > 0;
    return (
        <>
            <Box
                css={contentActionsStyle}
                component="form"
                onSubmit={(event) => event.preventDefault()}
                noValidate
                autoComplete="off"
            >
                <TextField
                    slotProps={{
                        input: {
                            endAdornment: (
                                <InputAdornment position="end">
                                    <SearchIcon />
                                </InputAdornment>
                            )
                        }
                    }}
                    label="Search projects"
                    type="search"
                    size="small"
                    value={query}
                    onChange={(event) =>
                        dispatch(setProjectFilterString(event.target.value))
                    }
                />
                <Autocomplete
                    multiple
                    filterSelectedOptions
                    options={[...new Set([...options, ...selectedTags])]}
                    value={selectedTags}
                    onChange={(_, tags) => setSelectedTags(tags)}
                    size="small"
                    sx={{
                        flex: 1,
                        minWidth: 180,
                        "& .MuiChip-root": { maxWidth: "100%" }
                    }}
                    renderInput={(params) => (
                        <TextField {...params} label="Filter by tags" />
                    )}
                    slotProps={{
                        paper: {
                            sx: {
                                "& .MuiAutocomplete-option": {
                                    overflowWrap: "anywhere"
                                }
                            }
                        }
                    }}
                />
                {isProfileOwner && (
                    <Button
                        color="inherit"
                        aria-label="Create new project"
                        onClick={() => dispatch(addProject())}
                        startIcon={<AddIcon />}
                    >
                        Create
                    </Button>
                )}
            </Box>
            {hasFilter && (
                <Box
                    sx={{
                        px: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        justifyContent: "space-between"
                    }}
                >
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        role="status"
                    >
                        {filtered.length}{" "}
                        {filtered.length === 1 ? "project" : "projects"}
                        {selectedTags.length > 1
                            ? " · matching all selected tags"
                            : ""}
                    </Typography>
                    <Button
                        size="small"
                        color="inherit"
                        onClick={() => {
                            setSelectedTags([]);
                            dispatch(setProjectFilterString(""));
                        }}
                    >
                        Clear filters
                    </Button>
                </Box>
            )}
            {hasFilter && filtered.length === 0 ? (
                <Box sx={{ px: 2, py: 3 }}>
                    <Typography>No matching projects</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Try another search or remove a tag.
                    </Typography>
                </Box>
            ) : (
                <ListContainer>
                    <ProfileLists
                        profileUid={profileUid}
                        isProfileOwner={isProfileOwner}
                        selectedSection={0}
                        filteredProjects={filtered}
                        selectedTags={selectedTags}
                        onTagClick={(tag) => {
                            const canonical =
                                options.find(
                                    (option) =>
                                        normalizeProjectText(option) ===
                                        normalizeProjectText(tag)
                                ) || tag;
                            setSelectedTags((current) =>
                                current.includes(canonical)
                                    ? current.filter(
                                          (selected) => selected !== canonical
                                      )
                                    : [...current, canonical]
                            );
                        }}
                    />
                </ListContainer>
            )}
        </>
    );
}
