import { Logging } from "@google-cloud/logging";

export const makeLogger = (logEntryName: string) => {
    const logging = new Logging();
    const logCloudFunction = logging.log(logEntryName);

    const log = (message: string): void => {
        const METADATA = {
            resource: {
                type: "cloud_function",
                labels: {
                    function_name: logEntryName,
                    region: "us-central1"
                }
            }
        };

        const data = {
            event: `${logEntryName}-event`,
            value: message,
            message: `${logEntryName}-event: ${message}`
        };

        const entry = logCloudFunction.entry(METADATA, data);
        logCloudFunction.write(entry);
    };

    return log;
};
