const { Logging } = require("@google-cloud/logging");

const LoggerFactory = log_entry_name => {
    const logging = new Logging();
    const log_cloud_function = logging.log(log_entry_name);

    const log = (functionName, message) => {
        const METADATA = {
            resource: {
                type: "cloud_function",
                labels: {
                    function_name: functionName,
                    region: "us-central1"
                }
            }
        };

        const data = {
            event: `${functionName}-event`,
            value: message,
            message: `${functionName}-event: ${message}`
        };

        const entry = log_cloud_function.entry(METADATA, data);

        log_cloud_function.write(entry);
    };

    return log;
};

module.exports = LoggerFactory;
