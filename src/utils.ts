import * as jsSHA from "jssha";

// https://stackoverflow.com/a/16016476/3714556
export function validateEmail(emailAddress: string) {
    var sQtext = '[^\\x0d\\x22\\x5c\\x80-\\xff]';
    var sDtext = '[^\\x0d\\x5b-\\x5d\\x80-\\xff]';
    var sAtom = '[^\\x00-\\x20\\x22\\x28\\x29\\x2c\\x2e\\x3a-\\x3c\\x3e\\x40\\x5b-\\x5d\\x7f-\\xff]+';
    var sQuotedPair = '\\x5c[\\x00-\\x7f]';
    var sDomainLiteral = '\\x5b(' + sDtext + '|' + sQuotedPair + ')*\\x5d';
    var sQuotedString = '\\x22(' + sQtext + '|' + sQuotedPair + ')*\\x22';
    var sDomain_ref = sAtom;
    var sSubDomain = '(' + sDomain_ref + '|' + sDomainLiteral + ')';
    var sWord = '(' + sAtom + '|' + sQuotedString + ')';
    var sDomain = sSubDomain + '(\\x2e' + sSubDomain + ')*';
    var sLocalPart = sWord + '(\\x2e' + sWord + ')*';
    var sAddrSpec = sLocalPart + '\\x40' + sDomain; // complete RFC822 email address spec
    var sValidEmail = '^' + sAddrSpec + '$'; // as whole string

    var reValidEmail = new RegExp(sValidEmail);

    return reValidEmail.test(emailAddress);
}

const dirtyWindow: any = (window as any);

export const isElectron: boolean =
    ((typeof dirtyWindow.process !== 'undefined') &&
     (typeof dirtyWindow.process.versions !== 'undefined') &&
     (typeof dirtyWindow.process.versions["electron"] !== 'undefined'));

export const generateUid = (filename: string): string => {
    let shaObj = new jsSHA("SHA-256", "TEXT");
    shaObj.update(new Date().getTime() + "");
    shaObj.update(filename);
    shaObj.update(Math.round(Math.random() * 1000) + "");
    return shaObj.getHash("HEX");
}

export function filterUndef<T>(ts: (T | undefined)[]): T[] {
    return ts.filter((t: T | undefined): t is T => !!t)
}
