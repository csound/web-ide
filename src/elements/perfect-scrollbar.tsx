import React, { forwardRef, useEffect } from "react";
import { css } from "@emotion/react";
import PerfectScrollbar from "perfect-scrollbar";
import "perfect-scrollbar/css/perfect-scrollbar.css";
import { perfectScrollbarStyleSheet } from "@styles/_perfect-scrollbar";

const scrollbarContainer = (theme) => css`
    ${perfectScrollbarStyleSheet(theme)}
    position: relative;
    height: auto;
    .ps__rail-x,
    .ps__rail-y {
        opacity: 0.6;
    }
`;

const ScrollBar = forwardRef((properties: any, reference: any) => {
    useEffect(() => {
        if (reference) {
            const current = reference.current;
            const ps: any = new PerfectScrollbar(
                current,
                properties.options || {}
            );
            if (properties.windowName) {
                (window as any)[properties.windowName] = ps;
            }
            if (properties.onScroll) {
                ps.onScroll = properties.onScroll;
            }
            const container = document.querySelector(
                `#${properties.windowName}`
            );
            if (typeof properties.initialScrollTop === "number" && container) {
                container.scrollTop = properties.initialScrollTop;
            }
            return () => {
                setTimeout(() => {
                    try {
                        ps.destroy(current);
                        if (properties.windowName) {
                            delete (window as any)[properties.windowName];
                        }
                    } catch {}
                }, 100);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reference]);

    return (
        <div
            ref={reference}
            css={scrollbarContainer}
            id={properties.windowName}
            style={properties.style || {}}
        >
            {properties.children}
        </div>
    );
});

ScrollBar.displayName = "ScrollBar";

export default ScrollBar;
