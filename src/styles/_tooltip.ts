import { css } from "@emotion/react";

// the absolute pos elem
const tooltipPopper = css`
    position: absolute !important;
    top: -10px !important;
    left: 0 !important;
`;

const tooltipElement = css`
    font-size: 13px !important;
    padding: 6px 12px !important;
`;

// inject into classes prop
export const tooltipClasses = {
    popper: tooltipPopper,
    tooltip: tooltipElement
};
