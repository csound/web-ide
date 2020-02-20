import React, { forwardRef, useEffect } from "react";
import { css } from "@emotion/core";
import PerfectScrollbar from "perfect-scrollbar";
import "perfect-scrollbar/css/perfect-scrollbar.css";
import { perfectScrollbarStyleSheet } from "@styles/_perfectScrollbar";

const scrollbarContainer = theme => css`
    ${perfectScrollbarStyleSheet(theme)}
    position: relative;
    height: 100%;
    .ps__rail-x,
    .ps__rail-y {
        opacity: 0.6;
    }
`;

const ScrollBar = forwardRef((props: any, ref: any) => {
    useEffect(() => {
        if (ref) {
            const current = ref.current;
            const ps: any = new PerfectScrollbar(current, props.options || {});
            if (props.windowName) {
                (window as any)[props.windowName] = ps;
            }
            if (props.onScroll) {
                ps.onScroll = props.onScroll;
            }
            const container = document.getElementById(props.windowName);
            if (typeof props.initialScrollTop === "number" && container) {
                container.scrollTop = props.initialScrollTop;
            }
            return () => {
                setTimeout(() => {
                    try {
                        ps.destroy(current);
                        if (props.windowName) {
                            delete (window as any)[props.windowName];
                        }
                    } catch (e) {}
                }, 100);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ref]);

    return (
        <div
            ref={ref}
            css={scrollbarContainer}
            id={props.windowName}
            style={props.style || {}}
        >
            {props.children}
        </div>
    );
});

export default ScrollBar;
