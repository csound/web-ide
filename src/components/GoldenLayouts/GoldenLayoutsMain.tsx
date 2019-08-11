import React, { Component } from "react";
import { connect } from "react-redux";
import GoldenLayout from "golden-layout";
import * as goldenLayoutActions from "./actions";
import wrapLayoutComponent from "./wrapperLayoutComponent"
import { IPanel } from "./interfaces";
import { IStore } from "../../db/interfaces";
import { IDocument, IProject } from "../Projects/interfaces";
import { store } from "../../store";
import Editor from "../Editor/Editor";
import FileTree from "../FileTree";
import "golden-layout/src/css/goldenlayout-base.css";
import "golden-layout/src/css/goldenlayout-dark-theme.css";

interface IGoldenLayoutProps {
    activeProject: number,
    activeDocument: number,
    createGoldenLayoutInstance: (goldenLayout: GoldenLayout) => void;
    goldenLayout: GoldenLayout;
    projects: IProject[],
    storeGoldenLayoutPanels: (panels: IPanel[]) => void;
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

        const { activeDocument, activeProject, projects } = this.props;

        const panels: IPanel[] = projects[activeProject].documents.map((document: IDocument, index: number) => {
            return {
                component: "Editor",
                type: "react-component",
                panelTitle: document.name,
                title: document.name,
                id: document.name,
                props: {
                    savedValue: document.savedValue,
                    documentIndex: index,
                    projectIndex: activeProject,
                },
            }
        });

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
                selectionEnabled: true,
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
                        id: "tabstack",
                        type: "stack",
                        content: panels,
                        activeItemIndex: activeDocument,
                    }
                ]
            }]
            };

        const goldenLayout = new GoldenLayout(config, this.layoutParentRef.current);

        this.props.createGoldenLayoutInstance(goldenLayout);

        this.props.storeGoldenLayoutPanels(panels);

        goldenLayout.registerComponent(
            "FileTree",
            wrapLayoutComponent(FileTree, store)
        );

        goldenLayout.registerComponent(
            "Editor",
            wrapLayoutComponent(Editor, store)
        );

        window.addEventListener("resize", this.updateDimensions);
        window.addEventListener("show", (e) => console.log(e, "EEE"));

        goldenLayout.on("show", (ugg) => {
            console.log(ugg, "??");
        })
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
        // HACK fix, click on all editors
        setTimeout(() => {
            projects[activeProject].documents.forEach((document: IDocument, index: number) => {
                const tabItem = goldenLayout.root.getItemsById(document.name);
                if (tabItem.length > 0) {
                    tabItem[0].on("show", () => console.log("SHOW", document.name))

                    // tabItem[0].parent.setActiveContentItem(tabItem[0]);
                    // const codemirrorScrollElement = tabItem[0].element[0].getElementsByClassName("CodeMirror-scroll");
                    // if (codemirrorScrollElement.length > 0) {
                    //     codemirrorScrollElement[0].focus();
                    //     codemirrorScrollElement[0].click();
                    //     setTimeout(() => codemirrorScrollElement[0].click(), 100);
                    //     var event = new MouseEvent('click', {bubbles: true});
                    //     codemirrorScrollElement[0].dispatchEvent(event);
                    // }


                }
            })
        }, 10)
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
        activeProject: store.ProjectsReducer.activeProject,
        activeDocument: store.ProjectsReducer.activeDocument,
        goldenLayout: store.GoldenLayoutReducer.goldenLayout,
        projects: store.ProjectsReducer.projects,
    };
};

const mapDispatchToProps = (dispatch: any): any => ({
    createGoldenLayoutInstance: (goldenLayout: GoldenLayout) =>
        dispatch(goldenLayoutActions.createGoldenLayoutInstance(goldenLayout)),
    storeGoldenLayoutPanels: (panels: IPanel[]) =>
        dispatch(goldenLayoutActions.storeGoldenLayoutPanels(panels)),
});


export default connect( mapStateToProps, mapDispatchToProps)(GoldenLayoutMain);
