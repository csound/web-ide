const fs = require("fs");
const { getFirebaseData } = require("./firebase");
const databaseName = { dev: "dev-database.json", prod: "prod-database.json" };
const databaseFolder = "./";
const { isSameHour } = require("date-fns");

const checkDatabaseFileWrittenSameHour = () => {
    try {
        const { timestamp } = openDatabaseFile(databaseID);
        return isSameHour(new Date(timestamp), new Date());
    } catch (e) {
        return false;
    }
};

const openDatabaseFile = databaseID => {
    const file = fs.readFileSync(
        `${databaseFolder}/${databaseName[databaseID]}`,
        "utf8"
    );
    return JSON.parse(file);
};

const writeDatabaseFile = (object, path) => {
    const fileJSON = JSON.stringify(object);
    fs.writeFileSync(path, fileJSON);
};

const writeFirebaseDataToDatabaseFile = async databaseID => {
    const fireBaseData = await getFirebaseData(databaseID);
    writeDatabaseFile(
        fireBaseData,
        `${databaseFolder}/${databaseName[databaseID]}`
    );
};

const getDatabase = async databaseID => {
    const sameHour = checkDatabaseFileWrittenSameHour(databaseID);

    if (sameHour === false) {
        await writeFirebaseDataToDatabaseFile(databaseID);
    }
    return openDatabaseFile(databaseID);
};

module.exports = {
    getDatabase
};
