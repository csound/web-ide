import React from "react";
import { Provider } from "react-redux";

function wrapLayoutComponent (Component: React.ElementType, store: any) {
    class Wrapped extends React.Component {
        render() {
            return (
                <Provider store={store}>
                    <Component {...this.props} />
                </Provider>
            );
        }
    }
    return Wrapped;
}

export default wrapLayoutComponent;
