const Fuse = require("fuse.js");
const memoize = require("fast-memoize");

const createFuzzySearch = (database = {}, key = "", options = {}) => {
    if (
        typeof database[key] === "undefined" ||
        Array.isArray(database[key]) === false
    ) {
        return null;
    }

    return new Fuse(database[key], options);
};

const createDatabaseSearch = (database = {}) => {
    const projects = createFuzzySearch(database, "projects", {
        keys: ["name", "description"]
    });
    const profiles = createFuzzySearch(database, "profiles", {
        keys: ["username", "displayName", "bio"]
    });
    const tags = createFuzzySearch(database, "tags", { keys: ["id"] });
    const searchMap = { projects, profiles, tags };

    return memoize((collection = "", query = "") => {
        if (
            typeof collection !== "string" ||
            typeof query !== "string" ||
            typeof searchMap[collection] === "undefined" ||
            collection === "" ||
            query === ""
        ) {
            return [];
        }

        const result = searchMap[collection].search(query);
        return result;
    });
};

const compareValues = (key, order = "asc") => {
    return (a, b) => {
        if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
            return 0;
        }

        const varA = typeof a[key] === "string" ? a[key].toUpperCase() : a[key];
        const varB = typeof b[key] === "string" ? b[key].toUpperCase() : b[key];

        let comparison = 0;
        if (varA > varB) {
            comparison = 1;
        } else if (varA < varB) {
            comparison = -1;
        }
        return order === "desc" ? comparison * -1 : comparison;
    };
};

const orderArrayByKey = memoize((array, orderKey, order) => {
    if (
        Array.isArray(array) &&
        array.length > 0 &&
        orderKey !== false &&
        order !== false &&
        typeof orderKey === "string" &&
        typeof array[0][orderKey] !== "undefined" &&
        typeof order === "string"
    ) {
        array.sort(compareValues(orderKey, order));
    }

    return array;
});

const searchResultFilter = memoize(
    (result = [], count = 0, offset = 0, orderKey = false, order = false) => {
        if (count !== false && offset !== false) {
            count = parseInt(count);
            offset = parseInt(offset);
        }

        if (
            Array.isArray(result) === false ||
            result.length === 0 ||
            typeof count !== "number" ||
            typeof offset !== "number" ||
            count === 0 ||
            offset >= result.length
        ) {
            return [];
        }

        let sortResult = orderArrayByKey(result, orderKey, order);
        sortResult = sortResult.slice(offset, offset + count);
        return sortResult;
    }
);

const createDatabaseList = (database = {}) => {
    return (collection = "") => {
        if (
            typeof collection !== "string" ||
            typeof database[collection] === "undefined" ||
            collection === ""
        ) {
            return [];
        }

        const result = database[collection];
        return result;
    };
};

module.exports = {
    createDatabaseSearch,
    searchResultFilter,
    createDatabaseList
};
