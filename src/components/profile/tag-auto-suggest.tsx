/* eslint-disable */
import React, { useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
// @ts-expect-error No type definitions available for react-autosuggest
import Autosuggest from "react-autosuggest";
// @ts-expect-error No type definitions available for autosuggest-highlight
import match from "autosuggest-highlight/match";
// @ts-expect-error No type definitions available for autosuggest-highlight
import parse from "autosuggest-highlight/parse";
import Paper from "@mui/material/Paper";
import MenuItem from "@mui/material/MenuItem";
import ChipInput from "./chip-input";
import { selectLoggedInUid } from "@comp/login/selectors";
import { selectAllTagsFromUser, selectCurrentTagText } from "./selectors";
import { setCurrentTagText } from "./actions";
import { append, dissoc, equals, pickAll, pipe, reject, values } from "ramda";
import Fuse from "fuse.js";

interface TagAutosuggestProps {
    allowDuplicates?: boolean;
    modifiedTags: string[];
    setModifiedTags: (tags: string[]) => void;
    [key: string]: any;
}

interface SuggestionsFetchRequestedParams {
    value: string;
}

interface SuggestionSelectedParams {
    suggestionValue: string;
}

interface RenderSuggestionParams {
    query: string;
    isHighlighted: boolean;
}

interface RenderInputComponentProps {
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    chips: string[];
    ref: React.Ref<HTMLInputElement> | null;
    [key: string]: any;
}

interface HighlightPart {
    text: string;
    highlight: boolean;
}

interface RenderSuggestionsContainerProps {
    containerProps: any;
    children: React.ReactNode;
}

const TagAutosuggest: React.FC<TagAutosuggestProps> = ({
    allowDuplicates,
    modifiedTags,
    setModifiedTags,
    ...other
}) => {
    const dispatch = useDispatch();
    const loggedInUserUid = useSelector(selectLoggedInUid);
    const allTags = useSelector(selectAllTagsFromUser(loggedInUserUid || ""));
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const textFieldInput = useSelector(selectCurrentTagText);

    const handleSuggestionsFetchRequested = useCallback(
        ({ value }: SuggestionsFetchRequestedParams) => {
            const options = {
                shouldSort: true
            };
            const fuse = new Fuse(allTags, options);
            const matches = fuse.search(value);
            const matchIndices = matches.map((match: any) => match.refIndex);
            const suggest = values(pickAll(matchIndices, allTags));
            setSuggestions(suggest);
        },
        [allTags]
    );

    const handleSuggestionsClearRequested = useCallback(() => {
        dispatch(setCurrentTagText(""));
    }, [dispatch]);

    const handleTextFieldInputChange = useCallback(
        (event: any, { newValue }: { newValue: string }) => {
            dispatch(setCurrentTagText(newValue));
        },
        [dispatch]
    );

    const handleAddChip = useCallback(
        (chip: string) => {
            if (allowDuplicates || !allTags.includes(chip)) {
                setModifiedTags(append(chip, modifiedTags));
                dispatch(setCurrentTagText(""));
            }
        },
        [allowDuplicates, allTags, modifiedTags, setModifiedTags, dispatch]
    );

    const handleDeleteChip = useCallback(
        (chip: string) => {
            setModifiedTags(reject(equals(chip), modifiedTags));
        },
        [modifiedTags, setModifiedTags]
    );

    const getSuggestionValue = useCallback(
        (suggestion: string) => suggestion,
        []
    );

    const onSuggestionSelected = useCallback(
        (
            event: React.FormEvent,
            { suggestionValue }: SuggestionSelectedParams
        ) => {
            handleAddChip(suggestionValue);
            event.preventDefault();
        },
        [handleAddChip]
    );

    const renderInputComponent = useCallback(
        ({
            onChange,
            chips,
            ref,
            key,
            ...otherProps
        }: RenderInputComponentProps & { key?: React.Key }) => (
            <ChipInput
                key={key}
                clearInputValueOnChange
                onUpdateInput={onChange}
                value={chips}
                inputRef={
                    ref as ((ref: HTMLInputElement | null) => void) | undefined
                }
                {...pipe(dissoc("projectUid"), dissoc("value"))(otherProps)}
            />
        ),
        []
    );

    const renderSuggestionsContainer = useCallback(
        ({ containerProps, children }: RenderSuggestionsContainerProps) => {
            const { key, ...otherContainerProps } = containerProps;
            return (
                <Paper key={key} {...otherContainerProps} square>
                    {children}
                </Paper>
            );
        },
        []
    );

    const renderSuggestion = useCallback(
        (
            suggestion: string,
            { query, isHighlighted }: RenderSuggestionParams
        ) => {
            const matches = match(suggestion, query);
            const parts = parse(suggestion, matches);

            return (
                <MenuItem
                    selected={isHighlighted}
                    component="div"
                    onMouseDown={(event) => event.preventDefault()}
                >
                    <div>
                        {parts.map((part: HighlightPart, index: number) => {
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
        },
        []
    );

    return (
        <Autosuggest
            alwaysRenderSuggestions={true}
            getSuggestionValue={getSuggestionValue}
            onSuggestionSelected={onSuggestionSelected}
            focusInputOnSuggestionClick={false}
            inputProps={{
                chips: modifiedTags,
                value: textFieldInput,
                onChange: handleTextFieldInputChange,
                onAdd: handleAddChip,
                onDelete: handleDeleteChip,
                ...other
            }}
            renderInputComponent={renderInputComponent}
            suggestions={suggestions}
            onSuggestionsFetchRequested={handleSuggestionsFetchRequested}
            onSuggestionsClearRequested={handleSuggestionsClearRequested}
            renderSuggestionsContainer={renderSuggestionsContainer}
            renderSuggestion={renderSuggestion}
        />
    );
};

export default TagAutosuggest;
