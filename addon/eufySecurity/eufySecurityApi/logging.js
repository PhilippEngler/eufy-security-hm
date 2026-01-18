"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setLoggingLevel = exports.rootI18nLogger = exports.rootConfLogger = exports.rootP2PLogger = exports.rootPushLogger = exports.rootMQTTLogger = exports.rootHTTPLogger = exports.rootAddonLogger = exports.rootMainLogger = exports.InternalLogger = exports.LogLevel = void 0;
exports.formatDate = formatDate;
const node_fs_1 = require("node:fs");
const node_util_1 = __importDefault(require("node:util"));
const node_path_1 = __importDefault(require("node:path"));
const typescript_logging_1 = require("typescript-logging");
const typescript_logging_category_style_1 = require("typescript-logging-category-style");
const utils_1 = require("./utils/utils");
exports.LogLevel = typescript_logging_1.LogLevel;
class InternalLogger {
    static logger;
}
exports.InternalLogger = InternalLogger;
const getMethodName = function () {
    const matches = new Error("").stack?.split("\n")[6].match(/ at( new){0,1} ([a-zA-Z0-9_\.]+) /);
    if (matches !== null && matches !== undefined && matches[2] !== undefined && matches[2] !== "eval") {
        return matches[2];
    }
    return undefined;
};
const provider = typescript_logging_category_style_1.CategoryProvider.createProvider("EufySecurityClientProvider", {
    level: exports.LogLevel.Off,
    dateFormatter: formatDate,
    channel: {
        type: "RawLogChannel",
        write: (msg, _formatArg) => {
            const methodName = getMethodName();
            const method = methodName ? `[${methodName}] ` : "";
            const logLevel = `${exports.LogLevel[msg.level].toUpperCase()}`.padEnd(5, " ");
            const logNames = `[${msg.logNames}]`.padEnd(7, " ");
            if (msg.args) {
                console.log(`${formatDate(msg.timeInMillis)} ${logLevel} ${logNames} ${msg.message}`, ...msg.args);
                logMessageForClient(`${formatDate(msg.timeInMillis)} ${logLevel} ${logNames} ${method}${msg.message}`, ...msg.args);
            }
            else {
                console.log(`${formatDate(msg.timeInMillis)} ${logLevel} ${logNames} ${msg.message}`);
                logMessageForClient(`${formatDate(msg.timeInMillis)} ${logLevel} ${logNames} ${method}${msg.message}`);
            }
            /*switch(msg.level) {
                case LogLevel.Trace:
                    if (msg.args)
                        InternalLogger.logger?.trace(`[${msg.logNames}] ${method}${msg.message}`, ...msg.args);
                    else
                        InternalLogger.logger?.trace(`[${msg.logNames}] ${method}${msg.message}`);
                    break;
                case LogLevel.Debug:
                    if (msg.args)
                        InternalLogger.logger?.debug(`[${msg.logNames}] ${method}${msg.message}`, ...msg.args);
                    else
                        InternalLogger.logger?.debug(`[${msg.logNames}] ${method}${msg.message}`);
                    break;
                case LogLevel.Info:
                    if (msg.args)
                        InternalLogger.logger?.info(`[${msg.logNames}] ${method}${msg.message}`, ...msg.args);
                    else
                        InternalLogger.logger?.info(`[${msg.logNames}] ${method}${msg.message}`);
                    break;
                case LogLevel.Warn:
                    if (msg.args)
                        InternalLogger.logger?.warn(`[${msg.logNames}] ${method}${msg.message}`, ...msg.args);
                    else
                        InternalLogger.logger?.warn(`[${msg.logNames}] ${method}${msg.message}`);
                    break;
                case LogLevel.Error:
                    if (msg.args)
                        InternalLogger.logger?.error(`[${msg.logNames}] ${method}${msg.message}`, ...msg.args);
                    else
                        InternalLogger.logger?.error(`[${msg.logNames}] ${method}${msg.message}`);
                    break;
                case LogLevel.Fatal:
                    if (InternalLogger.logger && InternalLogger.logger.fatal)
                        if (msg.args)
                            InternalLogger.logger.fatal(`[${msg.logNames}] ${method}${msg.message}`, ...msg.args);
                        else
                            InternalLogger.logger.fatal(`[${msg.logNames}] ${method}${msg.message}`);
                    break;
            }*/
        },
    },
});
exports.rootMainLogger = provider.getCategory("main");
exports.rootAddonLogger = provider.getCategory("addon");
exports.rootHTTPLogger = provider.getCategory("http");
exports.rootMQTTLogger = provider.getCategory("mqtt");
exports.rootPushLogger = provider.getCategory("push");
exports.rootP2PLogger = provider.getCategory("p2p");
exports.rootConfLogger = provider.getCategory("conf");
exports.rootI18nLogger = provider.getCategory("i18n");
const setLoggingLevel = function (category = "all", level = exports.LogLevel.Off) {
    switch (category) {
        case "all":
            provider.updateRuntimeSettings({
                level: level
            });
            break;
        case "main":
            provider.updateRuntimeSettingsCategory(exports.rootMainLogger, {
                level: level
            });
            break;
        case "addon":
            provider.updateRuntimeSettingsCategory(exports.rootAddonLogger, {
                level: level
            });
            break;
        case "http":
            provider.updateRuntimeSettingsCategory(exports.rootHTTPLogger, {
                level: level
            });
            break;
        case "mqtt":
            provider.updateRuntimeSettingsCategory(exports.rootMQTTLogger, {
                level: level
            });
            break;
        case "p2p":
            provider.updateRuntimeSettingsCategory(exports.rootP2PLogger, {
                level: level
            });
            break;
        case "push":
            provider.updateRuntimeSettingsCategory(exports.rootPushLogger, {
                level: level
            });
            break;
        case "conf":
            provider.updateRuntimeSettingsCategory(exports.rootConfLogger, {
                level: level
            });
            break;
        case "i18n":
            provider.updateRuntimeSettingsCategory(exports.rootI18nLogger, {
                level: level
            });
            break;
        default:
            console.log(`${formatDate(Date.now())} INFO  [log]   Unknown category '${category}'.`);
            logMessageForClient(`${formatDate(Date.now())} INFO  [log]   [Logging.setLoggingLevel] Unknown category '${category}'.`);
            break;
    }
    if (level === exports.LogLevel.Off) {
        if (category === "all") {
            console.log(`${formatDate(Date.now())} INFO  [log]   Logging for all categories has been set to ${exports.LogLevel[level]}.`);
            logMessageForClient(`${formatDate(Date.now())} INFO  [log]   [Logging.setLoggingLevel] Logging for all categories has been set to ${exports.LogLevel[level]}.`);
        }
        else {
            console.log(`${formatDate(Date.now())} INFO  [log]   Logging for category ${category} has been set to ${exports.LogLevel[level]}.`);
            logMessageForClient(`${formatDate(Date.now())} INFO  [log]   [Logging.setLoggingLevel] Logging for category ${category} has been set to ${exports.LogLevel[level]}.`);
        }
    }
};
exports.setLoggingLevel = setLoggingLevel;
function formatDate(millisSinceEpoch) {
    const date = new Date(millisSinceEpoch);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    const millis = date.getMilliseconds().toString().padStart(3, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${millis}`;
}
function logMessageForClient(message, ...messageArgs) {
    const pathToClientLog = node_path_1.default.join(utils_1.pathToLogFiles, "eufySecurityClient.log");
    let fileHandle;
    try {
        fileHandle = (0, node_fs_1.openSync)(pathToClientLog, "a");
        if (messageArgs) {
            let messageArgsString = "";
            for (const arg in messageArgs) {
                const message = node_util_1.default.format("%O", messageArgs[arg]);
                messageArgsString += `${messageArgsString.length > 0 ? ` ${message}` : message}`;
            }
            (0, node_fs_1.appendFileSync)(fileHandle, `${message} ${messageArgsString} \r\n`, "utf-8");
        }
        else {
            (0, node_fs_1.appendFileSync)(fileHandle, message + "\r\n", "utf-8");
        }
    }
    catch (e) {
        console.log(`${formatDate(Date.now())} ERROR [log]   ${e.message}`);
    }
    finally {
        if (fileHandle !== undefined) {
            (0, node_fs_1.closeSync)(fileHandle);
        }
    }
}
