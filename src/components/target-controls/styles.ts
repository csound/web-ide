import { css, SerializedStyles, Theme } from "@emotion/react";
import type { StylesConfig } from "react-select";

const controlButtonShadow = "0 1px 2px rgba(0, 0, 0, 0.12)";

export const buttonContainer = (theme: Theme): SerializedStyles => css`
    position: relative;
    color: ${theme.headerTextColor};
    height: 42px;
    width: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    margin-right: 4px;
    @media (max-width: 600px) {
        margin-right: 0;
    }
    @media (max-width: 380px) {
        width: 36px;
        height: 36px;
    }
    line-height: 1;
    box-shadow: ${controlButtonShadow};

    & > .Mui-disabled {
        opacity: 0.4;
    }

    button {
        border: 2px solid ${theme.highlightBackground};
        border-radius: 4px;
        transition:
            background-color 0.15s,
            border-color 0.15s;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        background-color: ${theme.headerBackground};
        &:hover {
            cursor: pointer;
            border-color: ${theme.line};
            background-color: ${theme.buttonBackgroundHover};
        }
        .Mui-disabled:hover {
            cursor: default !important;
        }
    }
`;

export const iconButton = (): SerializedStyles => css`
    border-radius: 2px;
    padding: 0 !important;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
`;

export const stopIcon = (theme: Theme): SerializedStyles => css`
    fill: ${theme.buttonIcon};
`;

export const reactSelectDropdownStyle = (
    theme: Theme
): StylesConfig<{ label: string; value: string }, false> => ({
    // Keep react-select's layout and scroll bounds; only override theme colors.
    control: (base, state) => ({
        ...base,
        minWidth: 240,
        backgroundColor: theme.headerBackground,
        borderColor: state.isFocused ? theme.textColor : theme.line,
        boxShadow: "none",
        ":hover": { borderColor: theme.textColor }
    }),
    menuPortal: (base) => ({ ...base, zIndex: 1500 }),
    menu: (base) => ({
        ...base,
        backgroundColor: theme.headerBackground,
        border: `1px solid ${theme.line}`,
        zIndex: 10
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
            ? theme.highlightBackgroundAlt
            : state.isFocused
              ? theme.buttonBackgroundHover
              : "transparent",
        color: theme.textColor,
        ":active": { backgroundColor: theme.highlightBackgroundAlt }
    }),
    singleValue: (base) => ({ ...base, color: theme.textColor }),
    placeholder: (base) => ({ ...base, color: theme.altTextColor }),
    input: (base) => ({ ...base, color: theme.textColor }),
    dropdownIndicator: (base) => ({ ...base, color: theme.altTextColor }),
    indicatorSeparator: (base) => ({ ...base, backgroundColor: theme.line })
});
