import { createMuiTheme } from '@material-ui/core/styles';

const darkTheme = createMuiTheme({
    palette: {
        primary: {
            light: "#efefef",
            main: "#272822",
            dark: "#002884",
            contrastText: "#fff",
        },
        secondary: {
            light: "#b3cde0",
            main: "#005b96",
            dark: "#011f4b",
            contrastText: "#854442",
        },
        background: {
            default: "#efefef",
        }
    },
});

export const resolveTheme = (themeName: string) => {
    switch (themeName) {
        case "dark": {
            return darkTheme;
        }
        default: {
            return darkTheme;
        }
    }
}
