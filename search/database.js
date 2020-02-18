const fs = require("fs");
const { getFirebaseData } = require("./firebase");
const databaseName = "database.json";
const databaseFolder = "/Users/eddyc/Desktop";
const { isSameDay } = require("date-fns");

const checkDatabaseFileWrittenSameDay = () => {
    try {
        const { timestamp } = openDatabaseFile();
        return isSameDay(new Date(timestamp), new Date());
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
    const sameDay = checkDatabaseFileWrittenSameDay();

    if (sameDay === false) {
        await writeFirebaseDataToDatabaseFile();
    }
    return openDatabaseFile();
};

module.exports = {
    getDatabase
};
