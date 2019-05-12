import { createMuiTheme } from '@material-ui/core/styles';

const darkTheme = createMuiTheme({
    palette: {
        primary: {
            light: '#757ce8',
            main: '#272822',
            dark: '#002884',
            contrastText: '#fff',
        },
        secondary: {
            light: '#ff7961',
            main: '#f44336',
            dark: '#ba000d',
            contrastText: '#000',
        },
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
