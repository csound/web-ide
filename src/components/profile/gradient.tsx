import { css } from "@emotion/core";

const shapes = (shapeIndex, theme) => {
    switch (shapeIndex) {
        case 0: {
            return `background: radial-gradient(black 15%, transparent 16%) 0 0,
        radial-gradient(black 15%, transparent 16%) 8px 8px,
        radial-gradient(rgba(255, 255, 255, 0.1) 15%, transparent 20%) 0 1px,
        radial-gradient(rgba(255, 255, 255, 0.1) 15%, transparent 20%) 8px 9px;
    background-color: ${theme.background};
    background-size: 16px 16px;`;
        }
        case 1: {
            return `background-color: ${theme.background};
background-image: linear-gradient(90deg, rgba(255,255,255,.07) 50%, transparent 50%),
linear-gradient(90deg, rgba(255,255,255,.13) 50%, transparent 50%),
linear-gradient(90deg, transparent 50%, rgba(255,255,255,.17) 50%),
linear-gradient(90deg, transparent 50%, rgba(255,255,255,.19) 50%);
background-size: 13px, 29px, 37px, 53px;`;
        }
        case 2: {
            return `background:
radial-gradient(circle at 0% 50%, rgba(96, 16, 48, 0) 9px, ${theme.highlightBackground} 10px, rgba(96, 16, 48, 0) 11px) 0px 10px,
radial-gradient(at 100% 100%, rgba(96, 16, 48, 0) 9px, ${theme.highlightBackground} 10px, rgba(96, 16, 48, 0) 11px),
${theme.background};
background-size: 20px 20px;`;
        }
        case 3: {
            return `
background-color: ${theme.background};
background-image: repeating-linear-gradient(transparent, transparent 50px, rgba(0,0,0,.4) 50px, rgba(0,0,0,.4) 53px, transparent 53px, transparent 63px, rgba(0,0,0,.4) 63px, rgba(0,0,0,.4) 66px, transparent 66px, transparent 116px, rgba(0,0,0,.5) 116px, rgba(0,0,0,.5) 166px, rgba(255,255,255,.2) 166px, rgba(255,255,255,.2) 169px, rgba(0,0,0,.5) 169px, rgba(0,0,0,.5) 179px, rgba(255,255,255,.2) 179px, rgba(255,255,255,.2) 182px, rgba(0,0,0,.5) 182px, rgba(0,0,0,.5) 232px, transparent 232px),
repeating-linear-gradient(270deg, transparent, transparent 50px, rgba(0,0,0,.4) 50px, rgba(0,0,0,.4) 53px, transparent 53px, transparent 63px, rgba(0,0,0,.4) 63px, rgba(0,0,0,.4) 66px, transparent 66px, transparent 116px, rgba(0,0,0,.5) 116px, rgba(0,0,0,.5) 166px, rgba(255,255,255,.2) 166px, rgba(255,255,255,.2) 169px, rgba(0,0,0,.5) 169px, rgba(0,0,0,.5) 179px, rgba(255,255,255,.2) 179px, rgba(255,255,255,.2) 182px, rgba(0,0,0,.5) 182px, rgba(0,0,0,.5) 232px, transparent 232px),
repeating-linear-gradient(125deg, transparent, transparent 2px, rgba(0,0,0,.2) 2px, rgba(0,0,0,.2) 3px, transparent 3px, transparent 5px, rgba(0,0,0,.2) 5px);
`;
        }
        case 4: {
            return `

background:
radial-gradient(circle at 50% 59%, ${theme.highlightBackground} 3%, ${theme.background} 4%, ${theme.background} 11%, rgba(54,78,39,0) 12%, rgba(54,78,39,0)) 50px 0,
radial-gradient(circle at 50% 41%, ${theme.background} 3%, ${theme.highlightBackground} 4%, ${theme.highlightBackground} 11%, rgba(210,202,171,0) 12%, rgba(210,202,171,0)) 50px 0,
radial-gradient(circle at 50% 59%, ${theme.highlightBackground} 3%, ${theme.background} 4%, ${theme.background} 11%, rgba(54,78,39,0) 12%, rgba(54,78,39,0)) 0 50px,
radial-gradient(circle at 50% 41%, ${theme.background} 3%, ${theme.highlightBackground} 4%, ${theme.highlightBackground} 11%, rgba(210,202,171,0) 12%, rgba(210,202,171,0)) 0 50px,
radial-gradient(circle at 100% 50%, ${theme.highlightBackground} 16%, rgba(210,202,171,0) 17%),
radial-gradient(circle at 0% 50%, ${theme.background} 16%, rgba(54,78,39,0) 17%),
radial-gradient(circle at 100% 50%, ${theme.highlightBackground} 16%, rgba(210,202,171,0) 17%) 50px 50px,
radial-gradient(circle at 0% 50%, ${theme.background} 16%, rgba(54,78,39,0) 17%) 50px 50px;
background-color: ${theme.highlightBackgroundAlt};
background-size:100px 100px;
`;
        }
    }
};

export const gradient = (shapeIndex) => (theme) =>
    css`
        ${shapes(shapeIndex, theme)}
        min-height: 100vh;
    `;
