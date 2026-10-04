import { Box, Tooltip } from "@mui/material";
import { projectTags } from "@comp/projects/tags";

/** Card tags are labels; profile-list tags provide filtering. */
export function ProjectCardTags({ tags }: { tags?: unknown }) {
    const labels = projectTags({ tags });
    if (!labels.length) return null;
    const [first, ...rest] = labels;
    const badge = {
        px: 0.5,
        borderRadius: 0.5,
        bgcolor: "rgba(12,16,20,0.65)",
        color: "#f3f4f6",
        fontSize: 10,
        lineHeight: "18px"
    };
    return (
        <Box
            data-testid="project-card-tags"
            aria-label="Project tags"
            sx={{
                gridRow: 2,
                gridColumn: 2,
                justifySelf: "end",
                alignSelf: "start",
                display: "flex",
                gap: 0.5,
                minWidth: 0,
                maxWidth: "100%",
                overflow: "hidden",
                whiteSpace: "nowrap"
            }}
        >
            <Tooltip title={first}>
                <Box
                    component="span"
                    tabIndex={0}
                    sx={{
                        ...badge,
                        minWidth: 0,
                        maxWidth: 96,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        "&:focus-visible": {
                            outline: "1px solid currentColor",
                            outlineOffset: -1
                        }
                    }}
                >
                    {first}
                </Box>
            </Tooltip>
            {rest.length > 0 && (
                <Tooltip
                    title={
                        <Box
                            sx={{
                                whiteSpace: "normal",
                                overflowWrap: "anywhere"
                            }}
                        >
                            {rest.join(", ")}
                        </Box>
                    }
                >
                    <Box
                        component="span"
                        tabIndex={0}
                        aria-label={`${rest.length} more tags`}
                        sx={{
                            ...badge,
                            flexShrink: 0,
                            cursor: "help",
                            "&:focus-visible": {
                                outline: "1px solid currentColor",
                                outlineOffset: -1
                            }
                        }}
                    >
                        +{rest.length}
                    </Box>
                </Tooltip>
            )}
        </Box>
    );
}
