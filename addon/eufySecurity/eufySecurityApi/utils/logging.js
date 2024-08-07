"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger1 = void 0;
class Logger1 {
    api;
    constructor(api) {
        this.api = api;
    }
    /**
     * Write the given message(s) to the logfile regardless the actual loglevel.
     * @param message The message to be added.
     * @param additionalMessages Additional message(s) to be added.
     */
    logInfoBasic(message, ...additionalMessages) {
        console.info(`${this.makeNowDateTimeString()} - ${message}`, ...additionalMessages);
    }
    /**
     * Write the given message(s) to the logfile if the loglevel is set to log info.
     * @param logLevel The current loglevel.
     * @param message The message to be added.
     * @param additionalMessages Additional message(s) to be added.
     */
    logInfo(logLevel, message, ...additionalMessages) {
        if (logLevel >= 1) {
            console.info(`${this.makeNowDateTimeString()} - INFO: ${message}`, ...additionalMessages);
        }
    }
    /**
     * Write the given message(s) to the logfile if the loglevel is set to log info.
     * @param message The message to be added.
     * @param additionalMessages Additional message(s) to be added.
     */
    info(message, ...additionalMessages) {
        if (this.api.getApiLogLevel() >= 1) {
            console.info(`${this.makeNowDateTimeString()} - INFO: ${message}`, ...additionalMessages);
        }
    }
    /**
     * Write the given message(s) to the errorlogfile regardless the actual loglevel.
     * @param message The message to be added.
     * @param additionalMessages Additional message(s) to be added.
     */
    logErrorBasis(message, ...additionalMessages) {
        console.error(`${this.makeNowDateTimeString()} - ${message}`, ...additionalMessages);
    }
    /**
     * Write the given message(s) to the errorlogfile. Additional the errors are written to the logile if the loglevel is set to log errors.
     * @param logLevel The current loglevel.
     * @param message The message to be added.
     * @param additionalMessages Additional message(s) to be added.
     */
    logError(logLevel, message, ...additionalMessages) {
        console.error(`${this.makeNowDateTimeString()} - ${message}`, ...additionalMessages);
        if (logLevel >= 2) {
            console.log(`${this.makeNowDateTimeString()} - ERROR: ${message}`, ...additionalMessages);
        }
    }
    /**
     * Write the given message(s) to the errorlogfile. Additional the errors are written to the logile if the loglevel is set to log errors.
     * @param message The message to be added.
     * @param additionalMessages Additional message(s) to be added.
     */
    error(message, ...additionalMessages) {
        console.error(`${this.makeNowDateTimeString()} - ${message}`, ...additionalMessages);
        if (this.api.getApiLogLevel() >= 2) {
            console.log(`${this.makeNowDateTimeString()} - ERROR: ${message}`, ...additionalMessages);
        }
    }
    /**
     * Write the given message(s) to the logfile if the loglevel is set to log debug messages.
     * @param logLevel The current loglevel.
     * @param message The message to be added.
     * @param additionalMessages Additional message(s) to be added.
     */
    logDebug(logLevel, message, ...additionalMessages) {
        if (logLevel >= 3) {
            console.debug(`${this.makeNowDateTimeString()} - DEBUG: ${message}`, ...additionalMessages);
        }
    }
    /**
     * Write the given message(s) to the logfile if the loglevel is set to log debug messages.
     * @param message The message to be added.
     * @param additionalMessages Additional message(s) to be added.
     */
    debug(message, ...additionalMessages) {
        if (this.api.getApiLogLevel() >= 3) {
            console.debug(`${this.makeNowDateTimeString()} - DEBUG: ${message}`, ...additionalMessages);
        }
    }
    /**
     * Write the given message(s) to the logfile if the loglevel is set to log debug messages.
     * @param logLevel The current loglevel.
     * @param message The message to be added.
     * @param additionalMessages Additional message(s) to be added.
     */
    logTrace(logLevel, message, ...additionalMessages) {
        if (logLevel >= 3) {
            console.trace(`${this.makeNowDateTimeString()} - TRACE: ${message}`, ...additionalMessages);
        }
    }
    /**
     * Write the given message(s) to the logfile if the loglevel is set to log debug messages.
     * @param message The message to be added.
     * @param additionalMessages Additional message(s) to be added.
     */
    trace(message, ...additionalMessages) {
        if (this.api.getApiLogLevel() >= 3) {
            console.trace(`${this.makeNowDateTimeString()} - TRACE: ${message}`, ...additionalMessages);
        }
    }
    /**
     * Write the given message(s) to the logfile if the loglevel is set to log info messages.
     * @param logLevel The current loglevel.
     * @param message The message to be added.
     * @param additionalMessages Additional message(s) to be added.
     */
    logWarn(logLevel, message, ...additionalMessages) {
        if (logLevel >= 1) {
            console.warn(`${this.makeNowDateTimeString()} - WARN: ${message}`, ...additionalMessages);
        }
    }
    /**
     * Write the given message(s) to the logfile if the loglevel is set to log warn messages.
     * @param message The message to be added.
     * @param additionalMessages Additional message(s) to be added.
     */
    warn(message, ...additionalMessages) {
        if (this.api.getApiLogLevel() >= 1) {
            console.warn(`${this.makeNowDateTimeString()} - WARN: ${message}`, ...additionalMessages);
        }
    }
    /**
     * Returns a datetime string for the current time in format "yyyy-mm-dd hh:mm:ss".
     */
    makeNowDateTimeString() {
        var dateTime = new Date();
        return (`${dateTime.getFullYear().toString()}-${(dateTime.getMonth() + 1).toString().padStart(2, '0')}-${dateTime.getDate().toString().padStart(2, '0')} ${dateTime.getHours().toString().padStart(2, '0')}:${dateTime.getMinutes().toString().padStart(2, '0')}:${dateTime.getSeconds().toString().padStart(2, '0')}`);
    }
}
exports.Logger1 = Logger1;
