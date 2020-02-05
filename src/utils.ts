// eslint-disable-next-line
import React, { useState, useEffect } from "react";
import {
    addIndex,
    append,
    assoc,
    concat,
    isNil,
    keys,
    mergeWith,
    uniq,
    map,
    pipe,
    reduce
} from "ramda";
import { debounce } from "throttle-debounce";

// {a: 1, b: 2} => [{key: "a", val: 1}, {key: "b", val: 2}]
export const listifyObject = obj =>
    reduce(
        (acc, k) =>
            append(pipe(assoc("key", k), assoc("val", obj[k]))({}), acc),
        [],
        keys(obj)
    );

// https://stackoverflow.com/a/16016476/3714556
export function validateEmail(emailAddress: string) {
    var sQtext = "[^\\x0d\\x22\\x5c\\x80-\\xff]";
    var sDtext = "[^\\x0d\\x5b-\\x5d\\x80-\\xff]";
    var sAtom =
        "[^\\x00-\\x20\\x22\\x28\\x29\\x2c\\x2e\\x3a-\\x3c\\x3e\\x40\\x5b-\\x5d\\x7f-\\xff]+";
    var sQuotedPair = "\\x5c[\\x00-\\x7f]";
    var sDomainLiteral = "\\x5b(" + sDtext + "|" + sQuotedPair + ")*\\x5d";
    var sQuotedString = "\\x22(" + sQtext + "|" + sQuotedPair + ")*\\x22";
    var sDomain_ref = sAtom;
    var sSubDomain = "(" + sDomain_ref + "|" + sDomainLiteral + ")";
    var sWord = "(" + sAtom + "|" + sQuotedString + ")";
    var sDomain = sSubDomain + "(\\x2e" + sSubDomain + ")*";
    var sLocalPart = sWord + "(\\x2e" + sWord + ")*";
    var sAddrSpec = sLocalPart + "\\x40" + sDomain; // complete RFC822 email address spec
    var sValidEmail = "^" + sAddrSpec + "$"; // as whole string

    var reValidEmail = new RegExp(sValidEmail);

    return reValidEmail.test(emailAddress);
}

const dirtyWindow: any = window as any;

export const isElectron: boolean =
    typeof dirtyWindow.process !== "undefined" &&
    typeof dirtyWindow.process.versions !== "undefined" &&
    typeof dirtyWindow.process.versions["electron"] !== "undefined";

export function filterUndef<T>(ts: (T | undefined)[]): T[] {
    return ts.filter((t: T | undefined): t is T => !!t);
}

export const mapIndexed = addIndex(map);

export function isMacintosh(): boolean {
    return navigator.platform.indexOf("Mac") > -1;
}

export const isMac: boolean = isMacintosh();

export const formatFileSize = (filesize: number): string => {
    const megabyte = Math.pow(10, 6);
    const kilobyte = Math.pow(10, 3);

    if (filesize > megabyte) {
        return (filesize / megabyte).toFixed(2) + " MB";
    } else if (filesize > kilobyte) {
        return (filesize / kilobyte).toFixed(2) + " KB";
    }
    return filesize + " B";
};

export const deepMerge = (v1, v2) => {
    if (Array.isArray(v1) && Array.isArray(v2)) {
        return uniq(concat(v1, v2));
    } else if (
        typeof v1 === "object" &&
        typeof v2 === "object" &&
        !isNil(v1) &&
        !isNil(v2)
    ) {
        return mergeWith(deepMerge, v1, v2);
    } else {
        return v2;
    }
};

// https://dev.to/gabe_ragland/debouncing-with-react-hooks-jci
// local state throttling, use only for components needing re-render
// for non-react actions, use import { debounce } from 'throttle-debounce';
export function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
        // eslint-disable-next-line
    }, [value]);
    return debouncedValue;
}

export const updateBodyScroller = debounceTime =>
    debounce(debounceTime, () => {
        const maybeElement: any = (window as any).ps_body;
        if (
            typeof maybeElement !== "undefined" &&
            typeof maybeElement.update === "function"
        ) {
            maybeElement.update();
        }
    });
