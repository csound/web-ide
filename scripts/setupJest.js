require("jest-fetch-mock").enableMocks();

Object.defineProperty(window.document, "styleSheets", {
    writable: true,
    value: ""
});

Object.defineProperty(window, "scrollTo", {
    writable: true,
    value: () => {}
});

fetch.mockResponse((req) => {
    if (req.url.endsWith("list/stars/8/0/count/desc")) {
        return {
            then: function () {
                return {
                    json: function () {
                        return { data: [], totalRecords: 0 };
                    }
                };
            }
        };
    } else {
        Promise.reject(new Error(`bad url ${req.url}`));
    }
});
