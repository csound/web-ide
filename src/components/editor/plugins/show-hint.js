// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE
// initializer modified for csound-web-ide

import * as CodeMirror from "codemirror";
import { path } from "ramda";

const HINT_ELEMENT_CLASS = "CodeMirror-hint";
const ACTIVE_HINT_ELEMENT_CLASS = "CodeMirror-hint-active";

// This is the old interface, kept around for now to stay
// backwards-compatible.
// eslint-disable-next-line no-import-assign
CodeMirror.showHint = function (cm, getHints, options) {
    if (!getHints) {
        return cm.showHint(options);
    }
    if (options && options.async) {
        getHints.async = true;
    }
    const newOptions = { hint: getHints };
    if (options) {
        for (const property in options) {
            newOptions[property] = options[property];
        }
    }
    return cm.showHint(newOptions);
};

CodeMirror.defineExtension("showHint", function (options) {
    options = parseOptions(this, this.getCursor("start"), options);
    const selections = this.listSelections();
    if (selections.length > 1) {
        return;
    }
    // By default, don't allow completion when something is selected.
    // A hint function can have a `supportsSelection` property to
    // indicate that it can handle selections.
    if (this.somethingSelected()) {
        if (!options.hint.supportsSelection) {
            return;
        }
        // Don't try with cross-line selections
        for (const selection of selections) {
            if (selection.head.line !== selection.anchor.line) {
                return;
            }
        }
    }

    if (this.state.completionActive) {
        this.state.completionActive.close();
    }
    const completion = (this.state.completionActive = new Completion(
        this,
        options
    ));
    if (!completion.options.hint) {
        return;
    }

    CodeMirror.signal(this, "startCompletion", this);
    completion.update(true);
});

CodeMirror.defineExtension("closeHint", function () {
    if (this.state.completionActive) {
        this.state.completionActive.close();
    }
});

function Completion(cm, options) {
    this.cm = cm;
    this.options = options;
    this.widget = undefined;
    this.debounce = 0;
    this.tick = 0;
    this.startPos = this.cm.getCursor("start");
    this.startLen =
        this.cm.getLine(this.startPos.line).length -
        this.cm.getSelection().length;

    const self = this;
    cm.on(
        "cursorActivity",
        (this.activityFunc = function () {
            self.cursorActivity();
        })
    );
}

const requestAnimationFrame =
    window.requestAnimationFrame ||
    function (function_) {
        return setTimeout(function_, 1000 / 60);
    };
const cancelAnimationFrame = window.cancelAnimationFrame || clearTimeout;

Completion.prototype = {
    close: function () {
        if (!this.active()) {
            return;
        }
        this.cm.state.completionActive = undefined;
        this.tick = undefined;
        this.cm.off("cursorActivity", this.activityFunc);

        if (this.widget && this.data) {
            CodeMirror.signal(this.data, "close");
        }
        if (this.widget) {
            this.widget.close();
        }
        CodeMirror.signal(this.cm, "endCompletion", this.cm);
    },

    active: function () {
        return this.cm.state.completionActive === this;
    },

    pick: function (data, index) {
        const completion = data.list[index];
        if (completion.hint) {
            completion.hint(this.cm, data, completion);
        } else {
            this.cm.replaceRange(
                getText(completion) + " ",
                completion.from || data.from,
                completion.to || data.to,
                "complete"
            );
        }
        CodeMirror.signal(data, "pick", completion);
        this.close();
    },

    cursorActivity: function () {
        if (this.debounce) {
            cancelAnimationFrame(this.debounce);
            this.debounce = 0;
        }

        const pos = this.cm.getCursor(),
            line = this.cm.getLine(pos.line);
        if (
            pos.line !== this.startPos.line ||
            line.length - pos.ch !== this.startLen - this.startPos.ch ||
            pos.ch < this.startPos.ch ||
            this.cm.somethingSelected() ||
            !pos.ch ||
            this.options.closeCharacters.test(line.charAt(pos.ch - 1))
        ) {
            this.close();
        } else {
            const self = this;
            this.debounce = requestAnimationFrame(function () {
                self.update();
            });
            if (this.widget) {
                this.widget.disable();
            }
        }
    },

    update: function (first) {
        if (!this.tick) {
            return;
        }
        const self = this;
        const myTick = ++this.tick;
        fetchHints(this.options.hint, this.cm, this.options, function (data) {
            if (self.tick === myTick) {
                self.finishUpdate(data, first);
            }
        });
    },

    finishUpdate: function (data, first) {
        if (this.data) {
            CodeMirror.signal(this.data, "update");
        }

        const picked =
            (this.widget && this.widget.picked) ||
            (first && this.options.completeSingle);
        if (this.widget) {
            this.widget.close();
        }

        this.data = data;

        if (data && data.list.length > 0) {
            if (picked && data.list.length === 1) {
                this.pick(data, 0);
            } else {
                this.widget = new Widget(this, data);
                CodeMirror.signal(data, "shown");
            }
        }
    }
};

function parseOptions(cm, pos, options) {
    const editor = cm.options.hintOptions;
    const out = {};
    for (const property in defaultOptions) {
        out[property] = defaultOptions[property];
    }
    if (editor) {
        for (const property in editor) {
            if (editor[property]) {
                out[property] = editor[property];
            }
        }
    }

    if (options) {
        for (const property in options) {
            if (options[property]) {
                out[property] = options[property];
            }
        }
    }

    if (out.hint.resolve) {
        out.hint = out.hint.resolve(cm, pos);
    }
    return out;
}

function getText(completion) {
    return typeof completion == "string" ? completion : completion.text;
}

function buildKeyMap(completion, handle) {
    const baseMap = {
        Up: function () {
            handle.moveFocus(-1);
        },
        Down: function () {
            handle.moveFocus(1);
        },
        PageUp: function () {
            handle.moveFocus(-handle.menuSize() + 1, true);
        },
        PageDown: function () {
            handle.moveFocus(handle.menuSize() - 1, true);
        },
        Home: function () {
            handle.setFocus(0);
        },
        End: function () {
            handle.setFocus(handle.length - 1);
        },
        Enter: handle.pick,
        Tab: handle.pick,
        Esc: handle.close
    };

    const mac = /Mac/.test(navigator.platform);

    if (mac) {
        baseMap["Ctrl-P"] = function () {
            handle.moveFocus(-1);
        };
        baseMap["Ctrl-N"] = function () {
            handle.moveFocus(1);
        };
    }

    const custom = completion.options.customKeys;
    const ourMap = custom ? {} : baseMap;
    function addBinding(key, value) {
        let bound;
        if (typeof value !== "string") {
            bound = function (cm) {
                return value(cm, handle);
            };
        } else if (typeof baseMap[value] !== "undefined") {
            bound = baseMap[value];
        } else {
            // This mechanism is deprecated
            bound = value;
        }

        ourMap[value] = bound;
    }
    if (custom) {
        for (const key in custom) {
            if (typeof custom[key] !== "undefined") {
                addBinding(key, custom[key]);
            }
        }
    }

    const extra = completion.options.extraKeys;
    if (extra) {
        for (const key in extra) {
            if (typeof extra[key] !== "undefined") {
                addBinding(key, extra[key]);
            }
        }
    }
    return ourMap;
}

function getHintElement(hintsElement, element) {
    while (element && element !== hintsElement) {
        if (
            element.nodeName.toUpperCase() === "LI" &&
            element.parentNode === hintsElement
        ) {
            return element;
        }

        element = element.parentNode;
    }
}

function Widget(completion, data) {
    this.completion = completion;
    this.data = data;
    this.picked = false;
    const widget = this,
        cm = completion.cm;
    const ownerDocument = cm.getInputField().ownerDocument;
    const parentWindow =
        ownerDocument.defaultView || ownerDocument.parentWindow;

    const hints = (this.hints = ownerDocument.createElement("ul"));
    const theme = completion.cm.options.theme;
    hints.className = "CodeMirror-hints " + theme;
    this.selectedHint = data.selectedHint || 0;

    const completions = data.list;
    completions.forEach((completion, index) => {
        const elt = hints.append(ownerDocument.createElement("li"));
        let className =
            HINT_ELEMENT_CLASS +
            (index !== this.selectedHint
                ? ""
                : " " + ACTIVE_HINT_ELEMENT_CLASS);
        if (completion.className) {
            className = completion.className + " " + className;
        }
        elt.className = className;
        if (completion.render) {
            completion.render(elt, data, completion);
        } else {
            elt.append(
                ownerDocument.createTextNode(
                    completion.displayText || getText(completion)
                )
            );
        }
        elt.hintId = index;
    });

    const container = completion.options.container || ownerDocument.body;
    let pos = cm.cursorCoords(completion.options.alignWithWord && data.from);
    let left = pos.left;
    let top = pos.bottom;
    let below = true;
    let offsetLeft = 0;
    let offsetTop = 0;
    if (container !== ownerDocument.body) {
        // We offset the cursor position because left and top are relative to the offsetParent's top left corner.
        const isContainerPositioned = [
            "absolute",
            "relative",
            "fixed"
        ].includes(parentWindow.getComputedStyle(container).position);
        const offsetParent = isContainerPositioned
            ? container
            : container.offsetParent;
        const offsetParentPosition = offsetParent.getBoundingClientRect();
        const bodyPosition = ownerDocument.body.getBoundingClientRect();
        offsetLeft =
            offsetParentPosition.left -
            bodyPosition.left -
            offsetParent.scrollLeft;
        offsetTop =
            offsetParentPosition.top -
            bodyPosition.top -
            offsetParent.scrollTop;
    }
    hints.style.left = left - offsetLeft + "px";
    hints.style.top = top - offsetTop + "px";

    // If we're at the edge of the screen, then we want the menu to appear on the left of the cursor.
    const winW =
        parentWindow.innerWidth ||
        Math.max(
            ownerDocument.body.offsetWidth,
            ownerDocument.documentElement.offsetWidth
        );
    const winH =
        parentWindow.innerHeight ||
        Math.max(
            ownerDocument.body.offsetHeight,
            ownerDocument.documentElement.offsetHeight
        );
    container.append(hints);
    let box = hints.getBoundingClientRect();
    const overlapY = box.bottom - winH;
    const scrolls = hints.scrollHeight > hints.clientHeight + 1;
    const startScroll = cm.getScrollInfo();

    if (overlapY > 0) {
        const height = box.bottom - box.top;
        const currentTop = pos.top - (pos.bottom - box.top);
        if (currentTop - height > 0) {
            // Fits above cursor
            hints.style.top = (top = pos.top - height - offsetTop) + "px";
            below = false;
        } else if (height > winH) {
            hints.style.height = winH - 5 + "px";
            hints.style.top = (top = pos.bottom - box.top - offsetTop) + "px";
            const cursor = cm.getCursor();
            if (data.from.ch !== cursor.ch) {
                pos = cm.cursorCoords(cursor);
                hints.style.left = (left = pos.left - offsetLeft) + "px";
                box = hints.getBoundingClientRect();
            }
        }
    }
    let overlapX = box.right - winW;
    if (overlapX > 0) {
        if (box.right - box.left > winW) {
            hints.style.width = winW - 5 + "px";
            overlapX -= box.right - box.left - winW;
        }
        hints.style.left = (left = pos.left - overlapX - offsetLeft) + "px";
    }
    if (scrolls) {
        for (let node = hints.firstChild; node; node = node.nextSibling) {
            node.style.paddingRight = cm.display.nativeBarWidth + "px";
        }
    }

    cm.addKeyMap(
        (this.keyMap = buildKeyMap(completion, {
            moveFocus: function (n, avoidWrap) {
                widget.changeActive(widget.selectedHint + n, avoidWrap);
            },
            setFocus: function (n) {
                widget.changeActive(n);
            },
            menuSize: function () {
                return widget.screenAmount();
            },
            length: completions.length,
            close: function () {
                completion.close();
            },
            pick: function () {
                widget.pick();
            },
            data: data
        }))
    );

    if (completion.options.closeOnUnfocus) {
        let closingOnBlur;
        cm.on(
            "blur",
            (this.onBlur = function () {
                closingOnBlur = setTimeout(function () {
                    completion.close();
                }, 100);
            })
        );
        cm.on(
            "focus",
            (this.onFocus = function () {
                clearTimeout(closingOnBlur);
            })
        );
    }

    cm.on(
        "scroll",
        (this.onScroll = function () {
            const currentScroll = cm.getScrollInfo(),
                editor = cm.getWrapperElement().getBoundingClientRect();
            const newTop = top + startScroll.top - currentScroll.top;
            let point =
                newTop -
                (parentWindow.pageYOffset ||
                    (ownerDocument.documentElement || ownerDocument.body)
                        .scrollTop);
            if (!below) {
                point += hints.offsetHeight;
            }
            if (point <= editor.top || point >= editor.bottom) {
                return completion.close();
            }

            hints.style.top = newTop + "px";
            hints.style.left =
                left + startScroll.left - currentScroll.left + "px";
        })
    );

    CodeMirror.on(hints, "dblclick", function (event) {
        const t = getHintElement(hints, event.target || event.srcElement);
        if (t && t.hintId) {
            widget.changeActive(t.hintId);
            widget.pick();
        }
    });

    CodeMirror.on(hints, "click", function (event) {
        const t = getHintElement(hints, event.target || event.srcElement);
        if (t && t.hintId) {
            widget.changeActive(t.hintId);
            if (completion.options.completeOnSingleClick) {
                widget.pick();
            }
        }
    });

    CodeMirror.on(hints, "mousedown", function () {
        setTimeout(function () {
            cm.focus();
        }, 20);
    });
    this.scrollToActive();

    CodeMirror.signal(
        data,
        "select",
        completions[this.selectedHint],
        hints.childNodes[this.selectedHint]
    );
    return true;
}

Widget.prototype = {
    close: function () {
        if (this.completion.widget !== this) {
            return;
        }
        this.completion.widget = undefined;
        this.hints.parentNode.remove(this.hints);
        this.completion.cm.removeKeyMap(this.keyMap);

        const cm = this.completion.cm;
        if (this.completion.options.closeOnUnfocus) {
            cm.off("blur", this.onBlur);
            cm.off("focus", this.onFocus);
        }
        cm.off("scroll", this.onScroll);
    },

    disable: function () {
        this.completion.cm.removeKeyMap(this.keyMap);
        const widget = this;
        this.keyMap = {
            Enter: function () {
                widget.picked = true;
            }
        };
        this.completion.cm.addKeyMap(this.keyMap);
    },

    pick: function () {
        this.completion.pick(this.data, this.selectedHint);
    },

    changeActive: function (index, avoidWrap) {
        if (index >= this.data.list.length) {
            index = avoidWrap ? this.data.list.length - 1 : 0;
        } else if (index < 0) {
            index = avoidWrap ? 0 : this.data.list.length - 1;
        }

        if (this.selectedHint === index) {
            return;
        }
        let node = this.hints.childNodes[this.selectedHint];
        if (node) {
            node.className = node.className.replace(
                " " + ACTIVE_HINT_ELEMENT_CLASS,
                ""
            );
        }

        node = this.hints.childNodes[(this.selectedHint = index)];
        node.className += " " + ACTIVE_HINT_ELEMENT_CLASS;
        this.scrollToActive();
        CodeMirror.signal(
            this.data,
            "select",
            this.data.list[this.selectedHint],
            node
        );
    },

    scrollToActive: function () {
        const node = this.hints.childNodes[this.selectedHint];
        if (node.offsetTop < this.hints.scrollTop) {
            this.hints.scrollTop = node.offsetTop - 3;
        } else if (
            node.offsetTop + node.offsetHeight >
            this.hints.scrollTop + this.hints.clientHeight
        ) {
            this.hints.scrollTop =
                node.offsetTop +
                node.offsetHeight -
                this.hints.clientHeight +
                3;
        }
    },

    screenAmount: function () {
        return (
            Math.floor(
                this.hints.clientHeight / this.hints.firstChild.offsetHeight
            ) || 1
        );
    }
};

function applicableHelpers(cm, helpers) {
    if (!cm.somethingSelected()) {
        return helpers;
    }
    const result = [];
    helpers.forEach((helper) => {
        if (helper.supportsSelection) {
            result.push(helper);
        }
    });

    return result;
}

function fetchHints(hint, cm, options, callback) {
    if (hint.async) {
        hint(cm, callback, options);
    } else {
        const result = hint(cm, options);
        if (result && result.then) {
            result.then(callback);
        } else {
            callback(result);
        }
    }
}

function resolveAutoHints(cm, pos) {
    const helpers = cm.getHelpers(pos, "hint");
    let words;
    if (helpers.length > 0) {
        const resolved = function (cm, callback, options) {
            const app = applicableHelpers(cm, helpers);
            function run(index) {
                if (index === app.length) {
                    return callback();
                }
                fetchHints(app[index], cm, options, function (result) {
                    if (result && result.list.length > 0) {
                        callback(result);
                    } else {
                        run(index + 1);
                    }
                });
            }
            run(0);
        };
        resolved.async = true;
        resolved.supportsSelection = true;
        return resolved;
    } else if ((words = cm.getHelper(cm.getCursor(), "hintWords"))) {
        return function (cm) {
            return CodeMirror.hint.fromList(cm, { words: words });
        };
    } else if (CodeMirror.hint.anyword) {
        return function (cm, options) {
            return CodeMirror.hint.anyword(cm, options);
        };
    } else {
        return function () {};
    }
}

CodeMirror.registerHelper("hint", "auto", {
    resolve: resolveAutoHints
});

CodeMirror.registerHelper("hint", "fromList", function (cm, options) {
    const cursor = cm.getCursor();
    const token = cm.getTokenAt(cursor);
    let term;
    let from = CodeMirror.Pos(cursor.line, token.start);
    const to = cursor;
    if (
        token.start < cursor.ch &&
        /\w/.test(token.string.charAt(cursor.ch - token.start - 1))
    ) {
        term = token.string.slice(0, cursor.ch - token.start);
    } else {
        term = "";
        from = cursor;
    }
    const found = [];
    options.words.forEach((word) => {
        if (word.slice(0, term.length) === term) {
            found.push(word);
        }
    });

    if (found.length > 0) {
        return { list: found, from: from, to: to };
    }
});

CodeMirror.commands.autocomplete = CodeMirror.showHint;

const defaultOptions = {
    hint: path(["hint", "auto"], CodeMirror),
    completeSingle: true,
    alignWithWord: true,
    closeCharacters: /[\s(),:;>[\]{}]/,
    closeOnUnfocus: true,
    completeOnSingleClick: true,
    container: undefined,
    customKeys: undefined,
    extraKeys: undefined
};

CodeMirror.defineOption("hintOptions");
