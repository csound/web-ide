export const closeModal = () => {
    return {
        type: "MODAL_CLOSE"
    };
};

const blurActiveElement = () => {
    const activeElement = document.activeElement;

    if (activeElement instanceof HTMLElement) {
        activeElement.blur();
    }
};

export const openSimpleModal = (
    modalComponentName: string,
    properties: Record<string, any> | undefined
) => {
    blurActiveElement();

    return {
        type: "MODAL_OPEN_SIMPLE",
        modalComponentName,
        properties
    };
};
