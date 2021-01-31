import React from "react";
import * as SS from "./styles";
import TextField from "@material-ui/core/TextField";

// <textarea
//     defaultValue={searchValue}
//     id="standard-name"
//     onChange={(event) => {
//         const query = event.target.value;
//         setSearchValue(query);
//         handler(query, 0);
//     }}
// />

const Search = (): React.ReactElement => {
    const onChange = React.useCallback((event) => {
        console.log("event", event);
    }, []);
    return (
        <>
            <div css={SS.homeHeading}>
                <h1 css={SS.homePageHeading}>Search</h1>
                <hr css={SS.homePageHeadingBreak} />
            </div>
            <TextField
                onChange={onChange}
                css={SS.searchField}
                name="search-field"
                label="Search field"
                type="search"
                variant="outlined"
            />
        </>
    );
};

export default Search;
