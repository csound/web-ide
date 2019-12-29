import { css } from "@emotion/core";

export const perfectScrollbarStyleSheet = theme => css`
    & .ps__rail-x:hover,
    & .ps__rail-y:hover,
    & .ps__rail-x:focus,
    & .ps__rail-y:focus,
    & .ps__rail-x.ps--clicking,
    & .ps__rail-y.ps--clicking {
        background-color: ${theme.highlightAlt.primary};
        width: 9px;
        opacity: 1;
    }

    & .ps:hover > .ps__rail-x,
    & .ps:hover > .ps__rail-y,
    & .ps--focus > .ps__rail-x,
    & .ps--focus > .ps__rail-y,
    & .ps--scrolling-x > .ps__rail-x,
    & .ps--scrolling-y > .ps__rail-y {
        opacity: 1;
    }
    .ps__rail-y {
        width: 9px;
    }
    .ps__thumb-y {
        background-color: ${theme.scrollbar.primary};
        width: 4px;
        opacity: 1;
    }
    .ps__rail-y:hover > .ps__thumb-y,
    .ps__rail-y:focus > .ps__thumb-y,
    .ps__rail-y.ps--clicking .ps__thumb-y {
        background-color: ${theme.scrollbarHover.primary};
        width: 8px;
    }
`;
