import { css, SerializedStyles, Theme } from "@emotion/react";
import { rgba } from "@styles/utils";

export const main: SerializedStyles = css`
    top: 39px;
    min-height: calc(100vh - 40px); /* minus the header height! */
`;

export const loadMain: SerializedStyles = css`
    overflow: hidden;
    > div {
        position: fixed;
        left: calc(50vw - 80px);
        top: calc(50vh - 80px);
    }
`;

export const modalSubmitButton = (theme: Theme): SerializedStyles => css`
    &.MuiButton-outlinedPrimary {
        color: ${theme.allowed};
        background-color: rgba(${rgba(theme.allowed, 0.05)});
    }
`;

export const loadingSpinner1: SerializedStyles = css`
    width: 300px;
    height: 300px;
    margin: 0 auto;
    margin-top: 33vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: transparent;
`;

export const loadingSpinner2: SerializedStyles = css`
    @keyframes spin {
        from {
            transform: rotate(0);
        }
        to {
            transform: rotate(359deg);
        }
    }
    width: 150px;
    height: 150px;
    padding: 3px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    background: rgb(63, 249, 220);
    background: linear-gradient(
        0deg,
        rgba(163, 149, 120, 0.1) 33%,
        rgba(163, 149, 120, 0.7) 100%
    );
    animation: spin 0.8s linear 0s infinite;
`;

export const loadingSpinner3: SerializedStyles = css`
    width: 100%;
    height: 100%;
    background-color: #374040;
    border-radius: 50%;
`;
