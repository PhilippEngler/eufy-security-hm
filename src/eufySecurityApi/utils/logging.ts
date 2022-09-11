import { EufySecurityApi } from "../eufySecurityApi";

export class Logger
{
    private api : EufySecurityApi;
    
    constructor (api : EufySecurityApi)
    {
        this.api = api;
    }
    
    /**
     * Write the given message(s) to the logfile regardless the actual loglevel.
     * @param message The message to be added.
     * @param additionalMessages Additional message(s) to be added.
     */
    public logInfoBasic(message : string, ...additionalMessages : any) : void
    {
        console.info(`${this.makeNowDateTimeString()} - ${message}`, ...additionalMessages);
    }

    /**
     * Write the given message(s) to the logfile if the loglevel is set to log info.
     * @param logLevel The current loglevel.
     * @param message The message to be added.
     * @param additionalMessages Additional message(s) to be added.
     */
    public logInfo(logLevel : number, message : string, ...additionalMessages : any) : void
    {
        if(logLevel >= 1)
        {
            console.info(`${this.makeNowDateTimeString()} - INFO: ${message}`, ...additionalMessages);
        }
    }

    /**
     * Write the given message(s) to the logfile if the loglevel is set to log info.
     * @param message The message to be added.
     * @param additionalMessages Additional message(s) to be added.
     */
    public info(message : string, ...additionalMessages : any) : void
    {
        if(this.api.getApiLogLevel() >= 1)
        {
            console.info(`${this.makeNowDateTimeString()} - INFO: ${message}`, ...additionalMessages);
        }
    }

    /**
     * Write the given message(s) to the errorlogfile regardless the actual loglevel.
     * @param message The message to be added.
     * @param additionalMessages Additional message(s) to be added.
     */
    public logErrorBasis(message : string, ...additionalMessages : any) : void
    {
        console.error(`${this.makeNowDateTimeString()} - ${message}`, ...additionalMessages);
    }

    /**
     * Write the given message(s) to the errorlogfile. Additional the errors are written to the logile if the loglevel is set to log errors.
     * @param logLevel The current loglevel.
     * @param message The message to be added.
     * @param additionalMessages Additional message(s) to be added.
     */
    public logError(logLevel : number, message : string, ...additionalMessages : any) : void
    {
        console.error(`${this.makeNowDateTimeString()} - ${message}`, ...additionalMessages);
        if(logLevel >= 2)
        {
            console.log(`${this.makeNowDateTimeString()} - ERROR: ${message}`, ...additionalMessages);
        }
    }

    /**
     * Write the given message(s) to the errorlogfile. Additional the errors are written to the logile if the loglevel is set to log errors.
     * @param message The message to be added.
     * @param additionalMessages Additional message(s) to be added.
     */
    public error(message : string, ...additionalMessages : any) : void
    {
        console.error(`${this.makeNowDateTimeString()} - ${message}`, ...additionalMessages);
        if(this.api.getApiLogLevel() >= 2)
        {
            console.log(`${this.makeNowDateTimeString()} - ERROR: ${message}`, ...additionalMessages);
        }
    }

    /**
     * Write the given message(s) to the logfile if the loglevel is set to log debug messages.
     * @param logLevel The current loglevel.
     * @param message The message to be added.
     * @param additionalMessages Additional message(s) to be added.
     */
    public logDebug(logLevel : number, message : string, ...additionalMessages : any) : void
    {
        if(logLevel >= 3)
        {
            console.debug(`${this.makeNowDateTimeString()} - DEBUG: ${message}`, ...additionalMessages);
        }
    }

    /**
     * Write the given message(s) to the logfile if the loglevel is set to log debug messages.
     * @param message The message to be added.
     * @param additionalMessages Additional message(s) to be added.
     */
    public debug(message : string, ...additionalMessages : any) : void
    {
        if(this.api.getApiLogLevel() >= 3)
        {
            console.debug(`${this.makeNowDateTimeString()} - DEBUG: ${message}`, ...additionalMessages);
        }
    }

    /**
     * Write the given message(s) to the logfile if the loglevel is set to log debug messages.
     * @param logLevel The current loglevel.
     * @param message The message to be added.
     * @param additionalMessages Additional message(s) to be added.
     */
    public logTrace(logLevel : number, message : string, ...additionalMessages : any) : void
    {
        if(logLevel >= 3)
        {
            console.trace(`${this.makeNowDateTimeString()} - TRACE: ${message}`, ...additionalMessages);
        }
    }

    /**
     * Write the given message(s) to the logfile if the loglevel is set to log debug messages.
     * @param message The message to be added.
     * @param additionalMessages Additional message(s) to be added.
     */
    public trace(message : string, ...additionalMessages : any) : void
    {
        if(this.api.getApiLogLevel() >= 3)
        {
            console.trace(`${this.makeNowDateTimeString()} - TRACE: ${message}`, ...additionalMessages);
        }
    }

    /**
     * Write the given message(s) to the logfile if the loglevel is set to log info messages.
     * @param logLevel The current loglevel.
     * @param message The message to be added.
     * @param additionalMessages Additional message(s) to be added.
     */
    public logWarn(logLevel : number, message : string, ...additionalMessages : any) : void
    {
        if(logLevel >= 1)
        {
            console.warn(`${this.makeNowDateTimeString()} - WARN: ${message}`, ...additionalMessages);
        }
    }


    /**
     * Write the given message(s) to the logfile if the loglevel is set to log warn messages.
     * @param message The message to be added.
     * @param additionalMessages Additional message(s) to be added.
     */
    public warn(message : string, ...additionalMessages : any) : void
    {
        if(this.api.getApiLogLevel() >= 1)
        {
            console.warn(`${this.makeNowDateTimeString()} - WARN: ${message}`, ...additionalMessages);
        }
    }

    /**
     * Returns a datetime string for the current time in format "yyyy-mm-dd hh:mm:ss".
     */
    private	makeNowDateTimeString() : string
    {
        var dateTime = new Date();
        return (`${dateTime.getFullYear().toString()}-${(dateTime.getMonth()+1).toString().padStart(2,'0')}-${dateTime.getDate().toString().padStart(2,'0')} ${dateTime.getHours().toString().padStart(2,'0')}:${dateTime.getMinutes().toString().padStart(2,'0')}:${dateTime.getSeconds().toString().padStart(2,'0')}`);
    }
}
