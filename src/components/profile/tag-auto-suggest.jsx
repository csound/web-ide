// eslint-disable-next-line no-use-before-define
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import Autosuggest from "react-autosuggest";
import match from "autosuggest-highlight/match";
import parse from "autosuggest-highlight/parse";
import Paper from "@material-ui/core/Paper";
import MenuItem from "@material-ui/core/MenuItem";
import { withStyles } from "@material-ui/core/styles";
import ChipInput from "material-ui-chip-input";
import { selectLoggedInUid } from "@comp/login/selectors";
import { selectAllTagsFromUser, selectCurrentTagText } from "./selectors";
import { setCurrentTagText } from "./actions";
import { append, dissoc, equals, pickAll, pipe, reject, values } from "ramda";
import Fuse from "fuse.js";

const styles = (theme) => ({
    container: {
        flexGrow: 1,
        position: "relative"
    },
    suggestionsContainerOpen: {
        position: "absolute",
        marginTop: theme.spacing(),
        marginBottom: theme.spacing(3),
        left: 0,
        right: 0,
        zIndex: 1
    },
    suggestion: {
        display: "block"
    },
    suggestionsList: {
        margin: 0,
        padding: 0,
        listStyleType: "none"
    },
    textField: {
        width: "100%"
    }
});

const TagAutosuggest = (properties) => {
    const {
        allowDuplicates,
        classes,
        modifiedTags,
        setModifiedTags,
        ...other
    } = properties;
    const dispatch = useDispatch();
    const loggedInUserUid = useSelector(selectLoggedInUid);
    const allTags = useSelector(selectAllTagsFromUser(loggedInUserUid));
    const [suggestions, setSuggestions] = useState([]);
    const textFieldInput = useSelector(selectCurrentTagText);
    const handleSuggestionsFetchRequested = ({ value }) => {
        const options = {
            shouldSort: true
        };
        const fuse = new Fuse(allTags, options);
        const matches = fuse.search(value);
        const suggest = values(pickAll(matches, allTags));
        setSuggestions(suggest);
    };

    const handleSuggestionsClearRequested = () => {
        dispatch(setCurrentTagText(""));
    };

    const handletextFieldInputChange = (event, { newValue }) => {
        dispatch(setCurrentTagText(newValue));
    };

    const handleAddChip = (chip) => {
        if (allowDuplicates || !allTags.includes(chip)) {
            setModifiedTags(append(chip, modifiedTags));
            dispatch(setCurrentTagText(""));
        }
    };

    const handleDeleteChip = (chip) => {
        setModifiedTags(reject(equals(chip), modifiedTags));
    };

    return (
        <Autosuggest
            alwaysRenderSuggestions={true}
            theme={{
                container: classes.container,
                suggestionsContainerOpen: classes.suggestionsContainerOpen,
                suggestionsList: classes.suggestionsList,
                suggestion: classes.suggestion
            }}
            getSuggestionValue={(s) => s}
            onSuggestionSelected={(event, { suggestionValue }) => {
                handleAddChip(suggestionValue);
                event.preventDefault();
            }}
            focusInputOnSuggestionClick={false}
            inputProps={{
                chips: modifiedTags,
                value: textFieldInput,
                onChange: handletextFieldInputChange,
                onAdd: (chip) => handleAddChip(chip),
                onDelete: (chip, index) => handleDeleteChip(chip, index),
                ...other
            }}
            renderInputComponent={({ onChange, chips, ref, ...other }) => (
                <ChipInput
                    clearInputValueOnChange
                    onUpdateInput={onChange}
                    value={chips}
                    inputRef={ref}
                    {...pipe(dissoc("projectUid"), dissoc("value"))(other)}
                />
            )}
            suggestions={suggestions}
            onSuggestionsFetchRequested={handleSuggestionsFetchRequested}
            onSuggestionsClearRequested={handleSuggestionsClearRequested}
            renderSuggestionsContainer={({ containerProps, children }) => (
                <Paper {...containerProps} square>
                    {children}
                </Paper>
            )}
            renderSuggestion={(suggestion, { query, isHighlighted }) => {
                const matches = match(suggestion, query);
                const parts = parse(suggestion, matches);

                return (
                    <MenuItem
                        selected={isHighlighted}
                        component="div"
                        onMouseDown={(event) => event.preventDefault()} // prevent the click causing the input to be blurred
                    >
                        <div>
                            {parts.map((part, index) => {
                                return part.highlight ? (
                                    <span
                                        key={String(index)}
                                        style={{ fontWeight: 500 }}
                                    >
                                        {part.text}
                                    </span>
                                ) : (
                                    <span key={String(index)}>{part.text}</span>
                                );
                            })}
                        </div>
                    </MenuItem>
                );
            }}
        />
    );
};

export default withStyles(styles)(TagAutosuggest);
