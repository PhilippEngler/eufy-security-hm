"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomematicApi = void 0;
const axios_1 = __importDefault(require("axios"));
const logging_1 = require("./logging");
/**
 * Interacting with the CCU.
 */
class HomematicApi {
    api;
    /**
     * Create the api object.
     */
    constructor(api) {
        this.api = api;
    }
    /**
     * Performs a request to the given url with given data and config.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     * @param data The data for the request.
     * @param requestConfig The config.
     */
    async request(hostName, useHttps, data, requestConfig) {
        return await axios_1.default.post(this.getUrl(hostName, useHttps), data, requestConfig);
    }
    /**
     * Generate the url to connect to the ccu.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     */
    getUrl(hostName, useHttps) {
        return `http${useHttps === true ? "s" : ""}://${hostName}:8181/esapi.exe`;
    }
    /**
     * Get the vaulue of a given system variable.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     * @param variableName The name of the system variable to get.
     */
    async getSystemVariable(hostName, useHttps, variableName) {
        const requestData = `string result='null';string svName;object svObject;foreach(svName, dom.GetObject(ID_SYSTEM_VARIABLES).EnumUsedNames()){svObject=dom.GetObject(ID_SYSTEM_VARIABLES).Get(svName);if(svName=='${variableName}'){result=svObject.Value();break;}}svName='null';svObject=null;`;
        const requestConfig = { headers: { "Content-Type": "text/plain" } };
        let data = "";
        this.getSystemVariables(hostName, useHttps);
        try {
            const response = await this.request(hostName, useHttps, requestData, requestConfig);
            data = response.data;
            data = data.substring(data.indexOf("<result>"));
            data = data.substring(8, data.indexOf("</result>"));
            return data;
        }
        catch (error) {
            logging_1.rootAddonLogger.error(`CCU request error on getSystemVariable(): code: ${error.code}; message: ${error.message}`);
            logging_1.rootAddonLogger.debug(`CCU request error on getSystemVariable():`, JSON.stringify(error));
            return undefined;
        }
    }
    /**
     * Get the vaulue of a given system variable.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     * @param variableName The name of the system variable to get.
     */
    async getSystemVariable1(hostName, useHttps, variableName) {
        const requestData = `result=dom.GetObject(ID_SYSTEM_VARIABLES).Get('${variableName}').Value()`;
        const requestConfig = { headers: { "Content-Type": "text/plain" } };
        let data = "";
        try {
            const response = await this.request(hostName, useHttps, requestData, requestConfig);
            data = response.data;
            data = data.substring(data.indexOf("<result>"));
            data = data.substring(8, data.indexOf("</result>"));
            return data;
        }
        catch (error) {
            logging_1.rootAddonLogger.error(`CCU request error on getSystemVariable1(): code: ${error.code}; message: ${error.message}`);
            logging_1.rootAddonLogger.debug(`CCU request error on getSystemVariable1():`, JSON.stringify(error));
            return undefined;
        }
    }
    /**
     * Set the given variable to the given value.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     * @param variableName The name of the system variable to set.
     * @param value The value to set.
     */
    async setSystemVariable(hostName, useHttps, variableName, value) {
        const requestData = `dom.GetObject(ID_SYSTEM_VARIABLES).Get('${variableName}').State('${value}')`;
        const requestConfig = { headers: { "Content-Type": "text/plain" } };
        //let data = "";
        try {
            await this.request(hostName, useHttps, requestData, requestConfig);
            //const response = await this.request(hostName, useHttps, requestData, requestConfig);
            //data = response.data;
            //data = data.substring(data.indexOf("<result>"));
            //data = data.substring(8, data.indexOf("</result>"));
            //return data;
        }
        catch (error) {
            logging_1.rootAddonLogger.error(`CCU request error on setSystemVariable(): code: ${error.code}; message: ${error.message}`);
            logging_1.rootAddonLogger.debug(`CCU request error on setSystemVariable():`, JSON.stringify(error));
        }
    }
    /**
     * Get all system variables available as array.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     * @param variablePrefix The string the variables to be retrieved should start with.
     * @returns An array containg all system variables.
     */
    async getSystemVariables(hostName, useHttps, variablePrefix) {
        const requestData = "string result=dom.GetObject(ID_SYSTEM_VARIABLES).EnumUsedNames();";
        const requestConfig = { headers: { "Content-Type": "text/plain" } };
        let data = "";
        let res;
        try {
            const response = await this.request(hostName, useHttps, requestData, requestConfig);
            data = response.data;
            data = data.substring(data.indexOf("<result>"));
            data = data.substring(8, data.indexOf("</result>"));
            res = data.split("\t");
            if (variablePrefix === undefined) {
                return res;
            }
            else {
                for (let i = 0; i < res.length; i++) {
                    if (!(res[i].startsWith(variablePrefix))) {
                        res.splice(i, 1);
                        i--;
                    }
                }
                return res;
            }
        }
        catch (error) {
            logging_1.rootAddonLogger.error(`CCU request error on getSystemVariables(): code: ${error.code}; message: ${error.message}`);
            logging_1.rootAddonLogger.debug(`CCU request error on getSystemVariables():`, JSON.stringify(error));
            res = undefined;
        }
    }
    /**
     * Create a system variable in the CCU.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     * @param variableName The name of the system variable to create.
     * @param variableInfo The info of the system variable to create.
     */
    async createSystemVariable(hostName, useHttps, variableName, variableInfo) {
        const requestData = `object sv=dom.GetObject(ID_SYSTEM_VARIABLES);object svObj=dom.CreateObject(OT_VARDP);svObj.Name('${variableName}');sv.Add(svObj.ID());svObj.ValueType(ivtString);svObj.ValueSubType(istChar8859);svObj.DPInfo('${variableInfo}');svObj.ValueUnit('');svObj.DPArchive(false);svObj.State('???');svObj.Internal(false);svObj.Visible(true);dom.RTUpdate(false);`;
        const requestConfig = { headers: { "Content-Type": "text/plain" } };
        let data = "";
        try {
            const response = await this.request(hostName, useHttps, requestData, requestConfig);
            data = response.data;
            data = data.substring(data.indexOf("<svObj>"));
            data = data.substring(7, data.indexOf("</svObj>"));
            return data;
        }
        catch (error) {
            logging_1.rootAddonLogger.error(`CCU request error on createSystemVariable(): code: ${error.code}; message: ${error.message}`);
            logging_1.rootAddonLogger.debug(`CCU request error on createSystemVariable():`, JSON.stringify(error));
            return undefined;
        }
    }
    /**
     * Remove a system variable from the CCU.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     * @param variableName The name of the system variable to remove.
     */
    async removeSystemVariable(hostName, useHttps, variableName) {
        const requestData = `string result='false';string svName;object svObject;foreach(svName, dom.GetObject(ID_SYSTEM_VARIABLES).EnumUsedNames()){svObject = dom.GetObject(ID_SYSTEM_VARIABLES).Get(svName);if(svName == '${variableName}'){dom.DeleteObject(svObject);result='true';break;}}`;
        const requestConfig = { headers: { "Content-Type": "text/plain" } };
        let data = "";
        try {
            const response = await this.request(hostName, useHttps, requestData, requestConfig);
            data = response.data;
            data = data.substring(data.indexOf("<result>"));
            data = data.substring(8, data.indexOf("</result>"));
            return data;
        }
        catch (error) {
            logging_1.rootAddonLogger.error(`CCU request error on removeSystemVariable(): code: ${error.code}; message: ${error.message}`);
            logging_1.rootAddonLogger.debug(`CCU request error on removeSystemVariable():`, JSON.stringify(error));
            return undefined;
        }
    }
    /**
     * Send a command to the CCU.
     * @param hostName The hostName of the ccu or localhost.
     * @param useHttps The boolean value for using HTTPS (true) or not (false).
     * @param command The command to be executed.
     */
    async sendInteractionCommand(hostName, useHttps, command) {
        const requestData = command;
        const requestConfig = { headers: { "Content-Type": "text/plain" } };
        try {
            await this.request(hostName, useHttps, requestData, requestConfig);
        }
        catch (error) {
            logging_1.rootAddonLogger.error(`CCU request error on sendInteractionCommand(): code: ${error.code}; message: ${error.message}`);
            logging_1.rootAddonLogger.debug(`CCU request error on sendInteractionCommand():`, JSON.stringify(error));
        }
    }
    /**
     * Returns the version info of the homematic api.
     */
    getHomematicApiVersion() {
        return "3.0.0";
    }
}
exports.HomematicApi = HomematicApi;
