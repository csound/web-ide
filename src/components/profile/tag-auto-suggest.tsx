import { Autocomplete, TextField } from "@mui/material";
import { useSelector } from "@root/store";
import { selectLoggedInUid } from "@comp/login/selectors";
import { selectAllTagsFromUser } from "./selectors";

export default function TagAutosuggest({
    modifiedTags,
    setModifiedTags
}: {
    modifiedTags: string[];
    setModifiedTags: (tags: string[]) => void;
}) {
    const userUid = useSelector(selectLoggedInUid);
    const allTags = useSelector(selectAllTagsFromUser(userUid || ""));

    return (
        <Autocomplete
            multiple
            freeSolo
            filterSelectedOptions
            options={[...new Set(allTags)]}
            value={modifiedTags}
            onChange={(_, tags) =>
                setModifiedTags([
                    ...new Set(tags.map((tag) => tag.trim()).filter(Boolean))
                ])
            }
            size="small"
            fullWidth
            renderInput={(parameters) => (
                <TextField
                    {...parameters}
                    label="Tags"
                    helperText="Press Enter to add a tag."
                />
            )}
            slotProps={{
                popper: { sx: { zIndex: 1400 } },
                paper: {
                    sx: {
                        "& .MuiAutocomplete-option": {
                            overflowWrap: "anywhere"
                        }
                    }
                }
            }}
            sx={{ "& .MuiChip-root": { maxWidth: "100%" } }}
        />
    );
}
