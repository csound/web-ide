// interface IThemeColorEntry {
//     primary: string;
//     secondary: string;
// }

// interface IThemeFontEntry {
//     regular: string;
//     monospace: string;
// }

export interface ITheme {
    [el: string]: string; // IThemeColorEntry | IThemeFontEntry;
}
