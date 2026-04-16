import { css, SerializedStyles, Theme } from "@emotion/react";

export const dialogShell = css`
    display: flex;
    flex-direction: column;
    min-width: min(420px, calc(100vw - 32px));
    background: #2f3645;
    color: #eef2ff;

    @media (max-width: 640px) {
        min-width: auto;
        width: 100%;
        min-height: 100%;
    }
`;

export const dialogHeader = (theme: Theme): SerializedStyles => css`
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 24px 24px 12px;
    border-bottom: 1px solid ${theme.line};
    background: linear-gradient(
        180deg,
        ${theme.highlightBackgroundAlt},
        ${theme.highlightBackground}
    );

    @media (max-width: 640px) {
        padding: 22px 18px 12px;
    }
`;

export const dialogEyebrow = css`
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgb(233 239 255 / 72%);
`;

export const dialogTitle = css`
    margin: 0;
    font-size: 28px;
    line-height: 1.1;
    color: #f8faff;

    @media (max-width: 640px) {
        font-size: 24px;
    }
`;

export const dialogSubtitle = css`
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: rgb(231 236 252 / 86%);
`;

export const dialogBody = css`
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px 24px 24px;
    color: #edf1ff;

    @media (max-width: 640px) {
        padding: 16px 18px 18px;
        gap: 16px;
    }
`;

export const fieldStack = css`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

export const actionStack = css`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

export const providerDivider = (theme: Theme): SerializedStyles => css`
    display: flex;
    align-items: center;
    gap: 10px;
    color: rgb(224 230 247 / 78%);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.06em;

    &::before,
    &::after {
        content: "";
        flex: 1;
        height: 1px;
        background: ${theme.line};
    }
`;

export const progressContainer = css`
    min-height: 4px;
`;

export const providerButtonsContainer = css`
    display: grid;
    gap: 8px;
`;

export const centerLink = css`
    display: flex;
    justify-content: center;
`;

export const helperCopy = css`
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: rgb(224 230 247 / 82%);
`;

export const authField = css`
    .MuiOutlinedInput-root {
        background: rgb(42 49 64 / 92%);
        color: #f8faff;
        font-size: 16px;
    }

    .MuiOutlinedInput-root fieldset {
        border-color: rgb(173 186 214 / 32%);
    }

    .MuiOutlinedInput-root:hover fieldset {
        border-color: rgb(173 186 214 / 52%);
    }

    .MuiOutlinedInput-root.Mui-focused fieldset {
        border-color: #87b7ff;
        border-width: 1px;
    }

    .MuiInputBase-input {
        color: #f8faff;
        -webkit-text-fill-color: #f8faff;
        caret-color: #f8faff;
    }

    .MuiOutlinedInput-root input:-webkit-autofill,
    .MuiOutlinedInput-root input:-webkit-autofill:hover,
    .MuiOutlinedInput-root input:-webkit-autofill:focus,
    .MuiOutlinedInput-root textarea:-webkit-autofill,
    .MuiOutlinedInput-root textarea:-webkit-autofill:hover,
    .MuiOutlinedInput-root textarea:-webkit-autofill:focus {
        -webkit-text-fill-color: #f8faff;
        caret-color: #f8faff;
        box-shadow: 0 0 0 1000px rgb(42 49 64 / 92%) inset;
        transition: background-color 9999s ease-in-out 0s;
        border-radius: inherit;
    }

    .MuiInputLabel-root {
        color: rgb(224 230 247 / 80%);
    }

    .MuiInputLabel-root.Mui-focused {
        color: #dce7ff;
    }

    .MuiInputLabel-root.MuiInputLabel-shrink {
        color: rgb(224 230 247 / 72%);
    }

    .MuiFormHelperText-root {
        color: rgb(224 230 247 / 74%);
    }
`;

export const subtleLink = css`
    color: #cfe0ff !important;
    cursor: pointer;
    text-decoration-color: rgb(207 224 255 / 70%);

    &:hover {
        color: #f8faff !important;
        text-decoration-color: #f8faff;
    }
`;

export const secondaryAction = css`
    background: rgb(83 94 120 / 95%) !important;
    color: #f5f7ff !important;

    &:hover {
        background: rgb(97 109 138 / 95%) !important;
    }
`;

export const providerButton = css`
    border-color: rgb(173 186 214 / 55%) !important;
    color: #f5f7ff !important;
    background: rgb(51 59 76 / 45%);

    &:hover {
        border-color: rgb(207 224 255 / 82%) !important;
        background: rgb(67 76 97 / 72%);
    }
`;

export const errorBox = (theme: Theme): SerializedStyles => css`
    margin: 0 24px 24px;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid ${theme.errorText};
    background: rgb(150 0 0 / 10%);
    color: ${theme.errorText};

    h5 {
        margin: 0 0 4px;
        font-size: 13px;
    }

    p {
        margin: 0;
        font-size: 12px;
        line-height: 1.45;
    }

    @media (max-width: 640px) {
        margin: 0 18px 18px;
    }
`;
