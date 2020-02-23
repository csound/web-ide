const Fuse = require("fuse.js");

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
    const stars = createFuzzySearch(database, "stars", {});

    const searchMap = { projects, profiles, tags, stars };

    return (collection = "", query = "") => {
        if (
            collection === "" ||
            query === "" ||
            typeof collection !== "string" ||
            typeof query !== "string" ||
            typeof searchMap[collection] === "undefined"
        ) {
            return false;
        }

        const result = searchMap[collection].search(query);
        return result;
    };
};

module.exports = {
    createDatabaseSearch
};
