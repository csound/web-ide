const fs = require("fs");
const { getFirebaseData } = require("./firebase");
const databaseName = "database.json";
const databaseFolder = "./";
const { isSameHour } = require("date-fns");

const checkDatabaseFileWrittenSameHour = () => {
    try {
        const { timestamp } = openDatabaseFile();
        return isSameHour(new Date(timestamp), new Date());
    } catch (e) {
        return false;
    }
};

const openDatabaseFile = () => {
    const file = fs.readFileSync(`${databaseFolder}/${databaseName}`, "utf8");
    return JSON.parse(file);
};

const writeDatabaseFile = (object, path) => {
    const fileJSON = JSON.stringify(object);
    fs.writeFileSync(path, fileJSON);
};

const writeFirebaseDataToDatabaseFile = async () => {
    const fireBaseData = await getFirebaseData();
    writeDatabaseFile(fireBaseData, `${databaseFolder}/${databaseName}`);
};

const getDatabase = async () => {
    const sameHour = checkDatabaseFileWrittenSameHour();

    if (sameHour === false) {
        await writeFirebaseDataToDatabaseFile();
    }
    return openDatabaseFile();
};

module.exports = {
    getDatabase
};
