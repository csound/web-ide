import React from "react";
import { Provider } from "react-redux";
import { ThemeProvider } from '@material-ui/styles';
import { resolveTheme } from "../Themes/themes";

function wrapLayoutComponent (Component: React.ElementType, store: any) {
    class Wrapped extends React.Component {
        render() {
            return (
                <Provider store={store}>
                    <ThemeProvider theme={resolveTheme(store.theme)}>
                        <Component {...this.props} />
                    </ThemeProvider>
                </Provider>
            );
        }
    }
    return Wrapped;
}

export default wrapLayoutComponent;
