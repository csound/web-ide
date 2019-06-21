export interface IPanel {
    type: string;
    component: string;
    id?: string;
    props?: any;
    panelTitle?: string;
    panelType?: string;
    panelPayload?: any;
    isClosable?: boolean;
    title?: string;
    activeItemIndex?: number;
    width?: number;
    height?: number;
}
