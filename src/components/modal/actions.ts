export const closeModal = () => {
    return {
        type: "MODAL_CLOSE"
    };
};

export const openSimpleModal = (
    modalComponentName: string,
    properties: Record<string, any> | undefined
) => {
    return {
        type: "MODAL_OPEN_SIMPLE",
        modalComponentName,
        properties
    };
};
