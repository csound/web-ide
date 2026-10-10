// Plot windows are nonmodal and can belong to different open editors.
const windows = new Set<HTMLElement>();

function stackWindows() {
    let zIndex = 1400;
    for (const frame of windows) frame.style.zIndex = String(zIndex++);
}

export function registerPlotWindow(frame: HTMLElement) {
    const activate = () => {
        if ([...windows].at(-1) === frame) return;
        windows.delete(frame);
        windows.add(frame);
        stackWindows();
    };
    const dispose = () => {
        windows.delete(frame);
        stackWindows();
    };
    activate();
    return {
        activate,
        dispose,
        close(onClose: (restoreEditorFocus: boolean) => void) {
            const hadFocus = frame.contains(frame.ownerDocument.activeElement);
            dispose();
            const previous = hadFocus ? [...windows].at(-1) : undefined;
            // Return directly to the previous plot, without briefly focusing
            // the closing plot's editor. The last plot returns to its editor.
            onClose(hadFocus && !previous);
            previous?.focus({ preventScroll: true });
        }
    };
}
