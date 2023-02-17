import React from "react";
import Avatar from "@mui/material/Avatar";
import styled from "@emotion/styled";
import { css, SerializedStyles, Theme } from "@emotion/react";
import { shadow } from "@styles/_common";

export const createButtonAddIcon = css`
    margin-bottom: 2px;
    margin-left: 2px;
`;

export const iconPreviewBox = css`
    margin-left: -16px;
    margin-top: -16px;
    border-radius: 50%;
    width: 62px;
    height: 62px;
    padding: 28px;
    justify-content: center;
    cursor: pointer;
`;

export const loadingSpinner = (theme: Theme): SerializedStyles => css`
@keyframes cricle {
  from {
    transform: rotate(-25deg);
  }
  to {
    transform: rotate(335deg);
  }
}
    padding-right: 25px;
    padding-bottom: 25px;
    position: absolute;

    & > span {
      display: inline-block;
      position: absolute;
      border-radius: 100px;
      padding: 8px;
      border: 5px solid transparent;

      animation: cricle 1s ease-in-out infinite;
      border-top: 5px solid ${theme.allowed};

      &:nth-of-type(1) {
        animation-delay: -0.15s;
      }

`;

export const pauseIcon = (theme: Theme): SerializedStyles => css`
    position: absolute;
    transform: rotate(90deg);
    cursor: pointer;
    border-color: ${theme.allowed};
    border-style: double;
    border-width: 0px 0 0px 20px;
    height: 26px;
`;

export const settingsIconContainer = css`
    position: absolute;
    top: calc(50% - 24px);
    right: 66px;
`;

export const settingsIcon = (theme: Theme): SerializedStyles => css`
    align-self: center;
    width: 42px;
    height: 42px;
    display: flex;
    justify-content: center;
    box-shadow: 0 1px 3px black, 0 1px 2px black;
    transition: color 0.2s ease, background-color 0.2s ease, transform 0.3s ease;
    background-color: ${theme.highlightBackgroundAlt};
    position: relative;
    border-radius: 50%;
    padding: 6px;
    margin: 4px;
    color: ${theme.settingsIcon};
    & svg {
        fill: ${theme.settingsIcon}!important;
    }
    &:after {
        content: "";
        width: 100%;
        height: 100%;
        border: solid 2px;
        position: absolute;
        top: 0px;
        left: 0px;
        border-radius: 50%;
        transition: all 0.3s ease;
    }
    &:hover {
        background-color: ${theme.settingsIcon};
        color: ${theme.settingsIcon};
        border-color: ${theme.highlightBackgroundAlt};
        background-color: transparent;
        transform: rotate(90deg);
        cursor: pointer;
        box-shadow: none;
    }
    &:hover:after {
        transform: scale(1);
        box-shadow: 10px 0 20px rgba(0, 0, 0, 0.49),
            6px 0 6px rgba(0, 0, 0, 0.53);
    }
    &:active {
        bottom: -2px;
    }

    & > svg {
        align-self: center;
        width: 100%;
        height: 100%;
    }
`;

export const deleteIconContainer = css`
    ${settingsIconContainer}
    right: 12px;
`;

export const deleteIcon = (theme: Theme): SerializedStyles => css`
    align-self: center;
    width: 42px;
    height: 42px;
    display: flex;
    justify-content: center;
    box-shadow: 0 1px 3px black, 0 1px 2px black;
    transition: color 0.2s ease, background-color 0.2s ease, transform 0.5s ease;
    background-color: ${theme.highlightBackgroundAlt};
    color: ${theme.errorText};
    & svg {
        fill: ${theme.errorText}!important;
    }
    position: relative;
    border-radius: 50%;
    padding: 6px;
    margin: 4px;

    &:after {
        content: "";
        width: 100%;
        height: 100%;
        border: solid 2px;
        position: absolute;
        top: 0px;
        left: 0px;
        border-radius: 50%;
        transition: all 1s ease;
        & svg {
            transition: all 1s ease;
        }
    }
    &:hover {
        background-color: ${theme.errorText};
        color: ${theme.errorText};
        border-color: ${theme.highlightBackgroundAlt};
        background-color: transparent;
        cursor: pointer;
        box-shadow: none;
        & svg {
            transform: scale(1.1);
        }
    }
    &:hover:after {
        box-shadow: 10px 0 20px rgba(0, 0, 0, 0.49),
            6px 0 6px rgba(0, 0, 0, 0.53);
    }
    &:active {
        bottom: -2px;
    }

    & > svg {
        align-self: center;
        width: 100%;
        height: 100%;
    }
`;

export const publicIconContainer = css`
    position: absolute;
    top: calc(50% - 24px);
    right: 120px;
`;

export const publicIcon = (theme: Theme): SerializedStyles => css`
    ${deleteIcon(theme)}
    color: ${theme.altButtonBackground};
    & svg {
        fill: ${theme.altButtonBackground}!important;
    }

    &:hover {
        color: ${theme.altButtonBackground};
        & svg {
            transform: scale(1.1, 0.9);
        }
    }
`;

export const showAvatarPlayButton = css`
    .projectIcon {
        opacity: 0;
    }
    .listPlayIcon {
        opacity: 1;
    }
    transform: rotate(90deg);
    cursor: pointer;
    box-shadow: none;
`;

export const avatar = css`
    align-self: center;
    pointer-events: visible;
    width: 64px;
    height: 64px;

    .listPlayIcon {
        opacity: 0;
        transition: opacity 1s ease-out;
        transform: translate(0px, -3px) rotate(-90deg);
        &:hover {
            z-index: 10;
        }
    }
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
    transition: color 0.2s ease, background-color 0.2s ease, transform 0.3s ease;
    &:after {
        content: "";
        width: 100%;
        height: 100%;
        transform: scale(0.8);
        position: absolute;
        top: -2px;
        left: -2px;
        border-radius: 50%;
        transition: all 0.3s ease;
    }
    &:hover:after {
        transform: scale(2);
        box-shadow: 10px 0 20px rgba(0, 0, 0, 0.19),
            6px 0 6px rgba(0, 0, 0, 0.23);
    }
    &:hover {
        ${showAvatarPlayButton}
        background-color: black!important;
    }
`;

type StyledAvatarType = {
    isPlaying: boolean;
    hasError: boolean;
    isPaused: boolean;
    isStop: boolean;
    isStartingUp: boolean;
    iconBackgroundColorProp: string;
    children: React.ReactElement;
    theme: Theme;
};

export const StyledAvatar = styled(Avatar as any, {
    shouldForwardProp: (property) =>
        ["children", "onClick", "src"].includes(property.toString())
            ? true
            : false
})`
    ${avatar}
    ${(properties: StyledAvatarType) =>
        ((properties.isPlaying &&
            !properties.hasError &&
            !properties.isStartingUp &&
            !properties.isStop) ||
            properties.isPaused) &&
        showAvatarPlayButton}
    background-color: ${(properties: StyledAvatarType) =>
        properties.hasError
            ? properties.theme.errorText
            : properties.isPlaying || properties.isStartingUp
            ? "black"
            : properties.iconBackgroundColorProp};
    ${shadow}
    .project-avatar {
        transition: all 400ms;
        display: ${(properties: StyledAvatarType) =>
            properties.isStartingUp || properties.isPlaying
                ? "none"
                : "inherit"};
        opacity: ${(properties: StyledAvatarType) =>
            properties.isPlaying ? 0 : 1};
    }
    &:hover {
        .project-avatar {
            opacity: ${(properties: StyledAvatarType) =>
                properties.isPlaying && !properties.isStop ? 1 : 0};
        }
    }
`;
