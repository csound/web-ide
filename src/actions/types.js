const requestType = name => {
    return {
        REQUEST: `${name}.REQUEST`,
        SUCCESS: `${name}.SUCCESS`,
        FAIL: `${name}.FAIL`
    };
};

export const READ_ALL = requestType("READ_ALL");

export const LOAD_CSOUND = requestType("LOAD_CSOUND");
