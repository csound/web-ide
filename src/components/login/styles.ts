import { css, SerializedStyles, Theme } from "@emotion/react";

export const errorBox = (theme: Theme): SerializedStyles => css`
    color: ${theme.errorText};
`;

export const centerLink = css`
    text-align: center;
    margin-bottom: 10px;
`;

export const providerButtonsContainer = css`
    display: grid;
    gap: 8px;
    padding: 0 24px 16px;
`;
