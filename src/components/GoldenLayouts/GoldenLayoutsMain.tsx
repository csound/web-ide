import React, { Component } from "react";
import { connect } from "react-redux";
import GoldenLayout from "golden-layout";
import * as goldenLayoutActions from "./actions";
import wrapLayoutComponent from "./wrapperLayoutComponent"
import { IPanel } from "./interfaces";
import { IStore } from "../../db/interfaces";
import { store } from "../../store";
import Editor from "../Editor/Editor";
import FileTree from "../FileTree";
import "golden-layout/src/css/goldenlayout-base.css";
import "golden-layout/src/css/goldenlayout-dark-theme.css";

// <Csound> </Csound>

interface IGoldenLayoutProps {
    createGoldenLayoutInstance: (goldenLayout: GoldenLayout) => void;
    goldenLayout: GoldenLayout;
}

interface IGoldenLayoutMainLocalState {
    // goldenLayout: GoldenLayout | null;
}

class GoldenLayoutMain extends Component<IGoldenLayoutProps, IGoldenLayoutMainLocalState> {

    protected layoutParentRef: any;

    // public readonly state: IGoldenLayoutMainLocalState = {
    //     goldenLayout: null,
    // };

    constructor(props: any) {
        super(props);
        this.layoutParentRef = React.createRef();
        this.updateDimensions = this.updateDimensions.bind(this);
    }

    public updateDimensions (event: Event | null) {
        const { goldenLayout } = this.props;
        if (goldenLayout) {
            goldenLayout.updateSize(
                document.body.clientWidth,
                document.body.clientHeight
            );
        }
    }

    public componentDidMount() {
        const panel: IPanel =  {
            component: "Editor",
            type: "react-component",
            panelTitle: "editor",
            title: "untitled.orc",
        };

        const fileTreePanel: IPanel =  {
            component: "FileTree",
            type: "react-component",
            panelTitle: "FileTree",
            title: "FileTree",
            isClosable: false,
        };

        const config = {
            settings:{
                // hasHeaders: false,
                // constrainDragToContainer: true,
                reorderEnabled: false,
                // selectionEnabled: false,
                // popoutWholeStack: true,
                // blockedPopoutsThrowError: true,
                // closePopoutsOnUnload: true,
                // showPopoutIcon: true,
                // showMaximiseIcon: true,
                // showCloseIcon: true
                },
            // dimensions: {
            //     borderWidth: 5,
            //     headerHeight: 25,
            //     minItemHeight: 800,
            //     minItemWidth: 1024
            // },
            content: [{
                type: "row",
                content: [
                    {
                        id: "left",
                        type: "stack",
                        content: [fileTreePanel],
                        width: 18
                    },
                    {
                        id: "center",
                        type: "stack",
                        content: [panel],
                    }
                ]
            }]
            };

        const goldenLayout = new GoldenLayout(config, this.layoutParentRef.current);

        this.props.createGoldenLayoutInstance(goldenLayout);

        goldenLayout.registerComponent(
            "FileTree",
            wrapLayoutComponent(FileTree, store)
        );

        goldenLayout.registerComponent(
            "Editor",
            wrapLayoutComponent(Editor, store)
        );

        window.addEventListener("resize", this.updateDimensions);

        // goldenLayout.on("tabCreated", (tab) => {
        //     tab._dragListener.on('drag', () => {
        //         //Drag Event
        //         console.log("TAB", tab);
        //     })
        // })

        // goldenLayout.on( 'initialised', function(){
        //     var noDropStack = goldenLayout.root.getItemsById( 'left' )[ 0 ];
        //     var originalGetArea = (noDropStack as any)._$getArea;
        //     (noDropStack as any)._$getArea = function() {
        //         var area = originalGetArea.call( noDropStack );
        //         delete (noDropStack as any)._contentAreaDimensions.header;
        //         return area;
        //     };
        // });

        setTimeout(() => goldenLayout.init(), 0);
        setTimeout(() => this.updateDimensions(null), 1);

    }

    public componentWillUnmount() {
        window.removeEventListener("resize", this.updateDimensions);
    }

    public render() {
        return (
            <div id="golden-layout-top" ref={this.layoutParentRef}></div>
        );
    }
}

const mapStateToProps = (store: IStore, ownProp: any): any => {
    return {
        goldenLayout: store.layout.goldenLayout,
    };
};

const mapDispatchToProps = (dispatch: any): any => ({
    createGoldenLayoutInstance: (goldenLayout: GoldenLayout) =>
        dispatch(goldenLayoutActions.createGoldenLayoutInstance(goldenLayout)),
});


export default connect( mapStateToProps, mapDispatchToProps)(GoldenLayoutMain);
