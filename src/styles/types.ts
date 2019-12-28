interface IThemeEntry {
    primary: string;
    secondary: string;
}

export interface ITheme {
    color: IThemeEntry;
    background: IThemeEntry;
}
