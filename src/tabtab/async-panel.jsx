import React from "react";
import Panel from "./panel.jsx";

export default class AsyncPanelComponent extends React.PureComponent {
    static defaultProps = {
        cache: true
    };

    cacheData;

    constructor(props) {
        super(props);
        this.loadPanel = this.loadPanel.bind(this);
        this.cacheData = undefined;
        this.state = {
            isLoading: false,
            data: undefined
        };
    }

    componentDidMount() {
        if (this.props.active) {
            this.loadPanel();
        }
    }

    loadPanel() {
        const { loadContent, cache } = this.props;
        if (cache && this.cacheData) {
            this.setState({
                isLoading: false,
                data: this.cacheData
            });
            return;
        }
        const callback = (err, data) => {
            if (err) {
                console.log("React-Tabtab async panel error:", err);
            }
            if (cache) {
                this.cacheData = data;
            }
            this.setState({
                isLoading: false,
                data
            });
        };
        const promise = loadContent(callback);
        if (promise) {
            promise.then(
                (data) => callback(undefined, data),
                (error) => callback(error)
            );
        }
        if (!this.state.isLoading) {
            this.setState({ isLoading: true });
        }
    }

    render() {
        const { render, renderLoading, CustomPanelStyle, active, index } =
            this.props;
        const { isLoading, data } = this.state;
        const content = isLoading ? renderLoading() : render(data);

        return (
            <Panel {...{ CustomPanelStyle, active, index }}>{content}</Panel>
        );
    }
}
