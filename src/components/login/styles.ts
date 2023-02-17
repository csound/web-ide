import { css, SerializedStyles, Theme } from "@emotion/react";

export const errorBox = (theme: Theme): SerializedStyles => css`
    color: ${theme.errorText};
`;

export const centerLink = css`
    text-align: center;
    margin-bottom: 10px;
`;
