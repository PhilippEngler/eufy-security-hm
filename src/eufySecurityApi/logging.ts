import { appendFileSync, closeSync, openSync } from "fs";
import { LogLevel as Level } from "typescript-logging";
import { CategoryProvider } from "typescript-logging-category-style";
import { pathToClientLog } from "./utils/utils";

export type LoggingCategories = "all" | "addon" | "main" | "http" | "p2p" | "push" | "mqtt";
export const LogLevel = Level;

export interface Logger {
    trace(message: unknown, ...args: unknown[]): void;
    debug(message: unknown, ...args: unknown[]): void;
    info(message: unknown, ...args: unknown[]): void;
    warn(message: unknown, ...args: unknown[]): void;
    error(message: unknown, ...args: unknown[]): void;
    fatal?(message: unknown, ...args: unknown[]): void;
}

export declare const dummyLogger: Logger;

export class InternalLogger {

    public static logger: Logger | undefined;

}

const getMethodName = function(): string | undefined {
    const matches = new Error("").stack?.split("\n")[6].match(/ at( new){0,1} ([a-zA-Z0-9_\.]+) /);
    if (matches !== null && matches !== undefined && matches[2] !== undefined && matches[2] !== "eval") {
        return matches[2];
    }
    return undefined;
}

const provider = CategoryProvider.createProvider("EufySecurityClientProvider", {
    level: LogLevel.Off,
    dateFormatter: formatDate,
    channel: {
        type: "RawLogChannel",
        write: (msg, _formatArg) => {
            const methodName = getMethodName();
            const method = methodName ? `[${methodName}] ` : "";
            const logLevel = `${LogLevel[msg.level].toUpperCase()}`.padEnd(5, " ")
            const logNames = `[${msg.logNames}]`.padEnd(7, " ");
            if (msg.args) {
                console.log(`${formatDate(msg.timeInMillis)} ${logLevel} ${logNames} ${msg.message}`, ...msg.args);
                logMessageForClient(`${formatDate(msg.timeInMillis)} ${logLevel} ${logNames} ${method}${msg.message}`, ...msg.args);
            } else {
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

export const rootMainLogger = provider.getCategory("main");
export const rootAddonLogger = provider.getCategory("addon");
export const rootHTTPLogger = provider.getCategory("http");
export const rootMQTTLogger = provider.getCategory("mqtt");
export const rootPushLogger = provider.getCategory("push");
export const rootP2PLogger = provider.getCategory("p2p");

export const setLoggingLevel = function(category: LoggingCategories = "all", level: Level = LogLevel.Off): void {
    switch(category) {
        case "all":
            provider.updateRuntimeSettings({
                level: level
            });
            break;
        case "main":
            provider.updateRuntimeSettingsCategory(rootMainLogger, {
                level: level
            });
            break;
        case "addon":
            provider.updateRuntimeSettingsCategory(rootAddonLogger, {
                level: level
            });
            break;
        case "http":
            provider.updateRuntimeSettingsCategory(rootHTTPLogger, {
                level: level
            });
            break;
        case "mqtt":
            provider.updateRuntimeSettingsCategory(rootMQTTLogger, {
                level: level
            });
            break;
        case "p2p":
            provider.updateRuntimeSettingsCategory(rootP2PLogger, {
                level: level
            });
            break;
        case "push":
            provider.updateRuntimeSettingsCategory(rootPushLogger, {
                level: level
            });
            break;
    }
}

export function formatDate(millisSinceEpoch: number): string {
    const date = new Date(millisSinceEpoch);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    const millis = date.getMilliseconds().toString().padStart(3, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds},${millis}`;
}

function logMessageForClient(message: string, ...messageArgs: any[]) {
    let fileHandle;
    try {
        fileHandle = openSync(pathToClientLog, 'a');
        if(messageArgs) {
            appendFileSync(fileHandle, message + messageArgs + "\r\n", 'utf-8');
        } else {
            appendFileSync(fileHandle, message + "\r\n", 'utf-8');
        }
    } catch (err: any) {
        console.log(`${formatDate(Date.now())} ERROR [log]   ${err.message}`);
    } finally {
        if (fileHandle !== undefined) {
            closeSync(fileHandle);
        }
    }
}