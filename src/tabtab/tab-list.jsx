import React from "react";
import styled from "@emotion/styled";
import { range } from "ramda";
import { LeftIcon, RightIcon, BulletIcon } from "./icon-svg.jsx";
import { isNumber } from "./utils/is-type.js";
import TabModal from "./tab-modal.jsx";

const buttonWidth = 35;

const getPadding = ({ showModalButton, showArrowButton }) => {
    let paddingLeft = 0;
    let paddingRight = 0;
    if (showModalButton) {
        paddingLeft += buttonWidth;
    }
    if (showArrowButton) {
        paddingLeft += buttonWidth;
        paddingRight += buttonWidth;
        if (showModalButton) {
            paddingLeft += 2;
        }
    }
    if (paddingLeft > 0) {
        paddingLeft += 3;
    }
    if (paddingRight > 0) {
        paddingRight += 3;
    }
    return `0 ${paddingRight}px 0 ${paddingLeft}px`;
};

const unifyScrollMax = (width) => {
    return Number.parseFloat((width / 3) * 2);
};

export const TabListStyle = styled.div`
    background-color: white;
    text-align: left;
    position: relative;
    white-space: nowrap;
    overflow: hidden;
    width: auto;
    padding: ${(props) => getPadding(props)};
`;

const ListInner = styled.div`
    overflow: hidden;
`;

const ListScroll = styled.ul`
    padding-left: 0;
    position: relative;
    margin: 0;
    list-style: none;
    display: inline-block;
    transition: transform 0.3s cubic-bezier(0.42, 0, 0.58, 1);
`;

export const ActionButtonStyle = styled.div`
  height: 100%;
  width ${buttonWidth}px;
  text-align: center;
  border: 1px solid #d9d9d9;
  border-bottom: 0;
  border-radius: 4px 4px 0 0;
  background: #f9f9f9;
  > svg {
    padding-top: 11px;
  }
`;

const makeScrollButton = (ActionButton) => styled(ActionButton)`
    display: inline-block;
    filter: none;
    position: absolute;
    ${(props) =>
        props.left
            ? props.showModalButton
                ? `left: ${buttonWidth + 2}px`
                : `left: 0`
            : "right: 0"};
    &:hover {
        cursor: pointer;
    }
    ${(props) => (props.customStyle ? props.customStyle(props) : "")}
`;

const makeFoldButton = (ActionButton) => styled(ActionButton)`
    display: inline-block;
    filter: none;
    position: absolute;
    left: 0;
    &:hover {
        cursor: pointer;
    }
    ${(props) => (props.customStyle ? props.customStyle(props) : "")}
`;

const ActionButton = ActionButtonStyle;
const ScrollButton = makeScrollButton(ActionButton);
const FoldButton = makeFoldButton(ActionButton);

export function TabListComponent({
    children,
    customStyle,
    activeIndex,
    handleEdit,
    handleTabChange,
    handleTabSequence,
    ExtraButton,
    showArrowButton: propsShowArrowButton,
    showModalButton: propsShowModalButton
}) {
    const listContainer = React.useRef();
    const rightArrowNode = React.useRef();
    const leftArrowNode = React.useRef();
    const listScroll = React.useRef();
    const foldNode = React.useRef();
    const [tabRefs, setTabRefs] = React.useState([]);
    const [scrollPosition, setScrollPosition] = React.useState(0);
    const [isMounted, setIsMounted] = React.useState(false);
    const [modalIsOpen, setModalIsOpen] = React.useState(false);
    const [showArrowButton, setShowArrowButton] = React.useState(false);
    const [showModalButton, setShowModalButton] = React.useState(false);

    const numChildren = children.length;

    const isShowModalButton = React.useCallback(() => {
        setShowModalButton(
            isNumber(propsShowModalButton)
                ? numChildren >= propsShowModalButton
                : propsShowModalButton
        );
    }, [numChildren, propsShowModalButton]);

    React.useEffect(() => {
        isShowModalButton();
    }, [isShowModalButton]);

    const isShowArrowButton = React.useCallback(() => {
        let newShowArrowButton = propsShowArrowButton;
        if (propsShowArrowButton === "auto") {
            let tabWidth = 0;
            const containerWidth = listContainer.current.offsetWidth;
            newShowArrowButton = false;
            for (const tab of tabRefs) {
                if (tab && tab.current) {
                    tabWidth += tab.current.offsetWidth;
                    if (tabWidth >= containerWidth) {
                        newShowArrowButton = true;
                        break;
                    }
                }
            }
        }
        // $FlowFixMe: flow will show 'auto' is not bool, but with this logic, showArrowButton will never be 'auto'
        setShowArrowButton(newShowArrowButton);
    }, [setShowArrowButton, propsShowArrowButton, listContainer, tabRefs]);

    React.useEffect(() => {
        isShowArrowButton();
    }, [isShowArrowButton]);

    React.useEffect(() => {
        // add or remove refs
        setTabRefs((elRefs) =>
            range(0, numChildren).map(
                (index) => elRefs[index] || React.createRef()
            )
        );
    }, [numChildren]);

    const scrollToIndex = React.useCallback(
        (index, rectSide) => {
            if (tabRefs.length - 1 < index) {
                // this may be annoying on initializaiton
                return;
            }
            const tabOffset = tabRefs[index].getBoundingClientRect();
            const containerOffset = listContainer.getBoundingClientRect();
            // Cancel scrolling if the tab is visible
            if (
                tabOffset.right < containerOffset.right &&
                tabOffset.left > containerOffset.left
            ) {
                return;
            }

            const leftMove = tabOffset[rectSide] - containerOffset[rectSide];
            let nextScrollPosition = scrollPosition + leftMove;
            if (nextScrollPosition < 0) {
                nextScrollPosition = 0;
            }
            if (listScroll.current) {
                listScroll.current.style.transform = `translate3d(-${scrollPosition}px, 0, 0)`;
            }

            setScrollPosition(nextScrollPosition);
        },
        [listContainer, scrollPosition, setScrollPosition, tabRefs]
    );

    const toggleModal = React.useCallback(
        (open) => {
            if (!open) {
                scrollToIndex(activeIndex, "right");
            }
            setModalIsOpen(open);
        },
        [scrollToIndex, setModalIsOpen, activeIndex]
    );

    const handleScroll = React.useCallback(
        (direction) => {
            let leftMove = 0;
            if (
                !listContainer.current ||
                tabRefs.length === 0 ||
                !listScroll.current
            ) {
                return;
            }
            const containerOffset =
                listContainer.current.getBoundingClientRect();
            const containerWidth = listContainer.current.offsetWidth;
            const tabFirstOffset = tabRefs[0].getBoundingClientRect();
            const tabLastOffset =
                tabRefs[tabRefs.length - 1].getBoundingClientRect();

            if (direction === "right") {
                leftMove = tabLastOffset.right - containerOffset.right;
                if (leftMove > containerWidth) {
                    leftMove = unifyScrollMax(containerWidth);
                }
            } else if (direction === "left") {
                leftMove = tabFirstOffset.left - containerOffset.left;
                if (-leftMove > containerWidth) {
                    leftMove = -unifyScrollMax(containerWidth);
                }
            }
            let newScrollPosition = scrollPosition + leftMove;
            // this.scrollPosition += leftMove;
            if (newScrollPosition < 0) {
                newScrollPosition = 0;
            }

            listScroll.current.style.transform = `translate3d(-${newScrollPosition}px, 0, 0)`;
            setScrollPosition(newScrollPosition);
        },
        [listScroll, scrollPosition, setScrollPosition, listContainer, tabRefs]
    );

    React.useEffect(() => {
        if (!isMounted) {
            if (activeIndex > 0) {
                scrollToIndex(activeIndex, "left");
            }
            setIsMounted(true);
            isShowArrowButton();
            isShowModalButton();
        }
    }, [
        activeIndex,
        isMounted,
        setIsMounted,
        isShowArrowButton,
        isShowModalButton,
        scrollToIndex
    ]);

    return (
        <>
            {ExtraButton}
            <TabListStyle
                className="tablist"
                hasExtraButton={!!ExtraButton}
                showModalButton={showModalButton}
                showArrowButton={showArrowButton}
            >
                {showModalButton ? (
                    <FoldButton
                        ref={foldNode}
                        customStyle={customStyle.ActionButton || false}
                        onClick={() => toggleModal(true)}
                        showArrowButton={showArrowButton}
                    >
                        <BulletIcon />
                    </FoldButton>
                ) : (
                    <></>
                )}
                {showArrowButton && (
                    <div>
                        <ScrollButton
                            left
                            onClick={() => {
                                handleScroll("left");
                            }}
                            ref={leftArrowNode}
                            showModalButton={showModalButton}
                            customStyle={customStyle.ActionButton || false}
                        >
                            <LeftIcon />
                        </ScrollButton>
                        <ScrollButton
                            onClick={() => {
                                handleScroll("right");
                            }}
                            ref={rightArrowNode}
                            customStyle={customStyle.ActionButton || false}
                        >
                            <RightIcon />
                        </ScrollButton>
                    </div>
                )}
                <ListInner ref={listContainer}>
                    <ListScroll ref={listScroll} role="tablist">
                        {React.Children.map(children, (child, index) =>
                            React.cloneElement(child, {
                                key: index,
                                active: index === activeIndex,
                                index,
                                tabIndex: index,
                                ref: tabRefs[index],
                                CustomTabStyle: customStyle.Tab,
                                handleTabChange,
                                handleEdit
                            })
                        )}
                    </ListScroll>
                </ListInner>
            </TabListStyle>
            {modalIsOpen ? (
                <TabModal
                    closeModal={() => toggleModal(false)}
                    handleTabSequence={handleTabSequence}
                    handleTabChange={handleTabChange}
                    activeIndex={activeIndex}
                >
                    {React.Children.map(children, (child, index) =>
                        React.cloneElement(child, {
                            key: index,
                            active: index === activeIndex,
                            index,
                            tabIndex: index,
                            ref: tabRefs[index],
                            vertical: true,
                            CustomTabStyle: customStyle.Tab,
                            handleTabChange,
                            handleEdit
                        })
                    )}
                </TabModal>
            ) : (
                <></>
            )}
        </>
    );
}

TabListComponent.displayName = "TabList";
