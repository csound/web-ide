import fs from "node:fs";
import { getFirebaseData } from "./firebase";
import { isSameHour } from "date-fns";

const databaseName: { dev: string; prod: string } = {
    dev: "dev-database.json",
    prod: "prod-database.json"
};

const databaseFolder = "./";

interface DatabaseFile {
    timestamp: string;
}

const checkDatabaseFileWrittenSameHour = (
    databaseID: "dev" | "prod"
): boolean => {
    try {
        const { timestamp } = openDatabaseFile(databaseID);
        return isSameHour(new Date(timestamp), new Date());
    } catch {
        return false;
    }
};

const openDatabaseFile = (databaseID: "dev" | "prod"): DatabaseFile => {
    const file = fs.readFileSync(
        `${databaseFolder}/${databaseName[databaseID]}`,
        "utf8"
    );
    return JSON.parse(file);
};

const writeDatabaseFile = (object: unknown, path: string): void => {
    const fileJSON = JSON.stringify(object);
    fs.writeFileSync(path, fileJSON);
};

const writeFirebaseDataToDatabaseFile = async (
    databaseID: "dev" | "prod"
): Promise<void> => {
    const fireBaseData = await getFirebaseData(databaseID);
    writeDatabaseFile(
        fireBaseData,
        `${databaseFolder}/${databaseName[databaseID]}`
    );
};

export const getDatabase = async (
    databaseID: "dev" | "prod"
): Promise<DatabaseFile> => {
    const sameHour = checkDatabaseFileWrittenSameHour(databaseID);

    if (!sameHour) {
        await writeFirebaseDataToDatabaseFile(databaseID);
    }
    return openDatabaseFile(databaseID);
};
