import {
    addIndex,
    concat,
    compose,
    isEmpty,
    isNil,
    mergeWith,
    not,
    uniq,
    map
} from "ramda";
import { debounce } from "throttle-debounce";

// {a: 1, b: 2} => [{key: "a", val: 1}, {key: "b", val: 2}]
export const listifyObject = (
    object: Record<string, any>
): { key: string; val: any }[] => {
    return Object.keys(object).reduce<{ key: string; val: any }[]>(
        (accumulator, key) => {
            accumulator.push({ key, val: object[key] });
            return accumulator;
        },
        []
    );
};

// https://stackoverflow.com/a/16016476/3714556
export function validateEmail(emailAddress: string): boolean {
    const sQtext = "[^\\x0d\\x22\\x5c\\x80-\\xff]";
    const sDtext = "[^\\x0d\\x5b-\\x5d\\x80-\\xff]";
    const sAtom =
        "[^\\x00-\\x20\\x22\\x28\\x29\\x2c\\x2e\\x3a-\\x3c\\x3e\\x40\\x5b-\\x5d\\x7f-\\xff]+";
    const sQuotedPair = "\\x5c[\\x00-\\x7f]";
    const sDomainLiteral = "\\x5b(" + sDtext + "|" + sQuotedPair + ")*\\x5d";
    const sQuotedString = "\\x22(" + sQtext + "|" + sQuotedPair + ")*\\x22";
    const sDomainReference = sAtom;
    const sSubDomain = "(" + sDomainReference + "|" + sDomainLiteral + ")";
    const sWord = "(" + sAtom + "|" + sQuotedString + ")";
    const sDomain = sSubDomain + "(\\x2e" + sSubDomain + ")*";
    const sLocalPart = sWord + "(\\x2e" + sWord + ")*";
    const sAddrSpec = sLocalPart + "\\x40" + sDomain; // complete RFC822 email address spec
    const sValidEmail = "^" + sAddrSpec + "$"; // as whole string

    const reValidEmail = new RegExp(sValidEmail);

    return reValidEmail.test(emailAddress);
}

const dirtyWindow: any = window as any;

export const isElectron: boolean =
    dirtyWindow.process !== undefined &&
    dirtyWindow.process.versions !== undefined &&
    dirtyWindow.process.versions["electron"] !== undefined;

export function filterUndef<T>(ts: (T | undefined)[]): T[] {
    return ts.filter((t: T | undefined): t is T => !!t);
}

export const mapIndexed = addIndex(map);

export const notEmpty = compose(not, isEmpty);

export function isMacintosh(): boolean {
    return navigator.platform.includes("Mac");
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

export const deepMerge = (
    v1: Array<any> | Record<string, any>,
    v2: Array<any> | Record<string, any>
): Array<any> | Record<string, any> => {
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

export const updateBodyScroller = (debounceTime: number) =>
    debounce(debounceTime, () => {
        const maybeElement: any = (window as any).ps_body;
        if (
            maybeElement !== undefined &&
            typeof maybeElement.update === "function"
        ) {
            maybeElement.update();
        }
    });

export const isMobile = (): boolean =>
    /android|webos|iphone|ipad|ipod|opera mini/i.test(navigator.userAgent);

export const isIOS = (): boolean =>
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
